/** Xưởng Cơ Khí Tốc Độ — typed bridge to the non-blocking CFOP solver worker.
 *
 * Một worker Pyodide duy nhất (`solverWorker.ts`) đảm nhiệm solve, bld và
 * warmup (tốn CPU). Việc kiểm tra hợp lệ trạng thái (`validateStateInBrowser`)
 * chạy thuần JavaScript trong trang (`lib/cubeValidation.ts`), còn duyệt danh
 * mục case 1LLL/ZBLL (`listLastLayerCasesInBrowser`) đọc từ dữ liệu đã được
 * nhúng sẵn (`features/last-layer/lib/directCaseCatalog.ts`) — không cần
 * runtime Python.
 */
import { validateCubeState } from "./cubeValidation";
import type { CubeValidation } from "./cubeValidation";
import type { LastLayerCatalogCase } from "@/features/last-layer/lib/directCaseCatalog";
export type { CubeValidation, LastLayerCatalogCase };

export type TraceStep = {
  index: number;
  phase: string;
  move: string;
  state: string;
};
export type PhaseResult = {
  name: string;
  algorithm: string;
  moves: string[];
  state_after: string;
  valid_after: boolean;
  predicate_after: boolean;
  case_id: string | null;
  start: number;
  end: number;
};
export type DirectAttempt = {
  slots: F2LSlot[];
  nodes: number;
  budget: number;
  depth: number;
  status: "solved" | "budget" | "no_solution";
};
export type OpeningTelemetry = {
  requested: string;
  target: string;
  achieved: string;
  attempts: string[];
  method?: "direct" | "expanded" | "unavailable" | "staged";
  fallback_count: number;
  did_fallback: boolean;
  direct_search?: { node_budget: number; attempts: DirectAttempt[] };
};
export type LastLayerMode = "oll_pll" | "zbll" | "1lll" | "auto";
export type LastLayerTelemetry = {
  requested: string;
  achieved: string;
  attempts: string[];
  case_id?: string | null;
  fallback_count: number;
  did_fallback: boolean;
};
export type SolverResult = {
  initial_state: string;
  final_state: string;
  algorithm: string;
  phases: PhaseResult[];
  trace: TraceStep[];
  opening: OpeningTelemetry;
  last_layer: LastLayerTelemetry;
};
export type CrossColor = "U" | "R" | "F" | "D" | "L" | "B";
export type OpeningMode =
  "cross" | "auto" | "xcross" | "xxcross" | "xxxcross" | "xxxxcross";
export type F2LSlot = "FR" | "FL" | "BL" | "BR";
export type XCrossOptions = {
  preferredSlot?: F2LSlot;
  excludedSlots?: F2LSlot[];
};
export type BldCycle = {
  buffer: string;
  targets: string[];
  cycle_break: boolean;
  memo: string;
  execution_keys: string[];
};
export type BldResult = {
  initial_state: string;
  analysis: BldAnalysis;
};
export type BldAnalysis = {
  method: string;
  buffers: {
    edge: { letter: string; position: string };
    corner: { letter: string; position: string };
  };
  edges: { cycles: BldCycle[]; memo: string[]; execution_keys: string[] };
  corners: { cycles: BldCycle[]; memo: string[]; execution_keys: string[] };
  special: {
    parity: boolean;
    edge_flips: string[];
    corner_twists: { position: string; direction: "cw" | "ccw" }[];
    edge_orientation_sum: number;
    corner_orientation_sum: number;
  };
  solved: boolean;
  catalog: { provider: string; source: string; note: string };
};

export const SOLVER_TIMEOUT_MS = 45000;

export class SolverCancelledError extends Error {
  constructor() {
    super("Solver request cancelled.");
    this.name = "SolverCancelledError";
  }
}

export class SolverTimeoutError extends Error {
  constructor() {
    super("Solver request exceeded the time limit and was stopped.");
    this.name = "SolverTimeoutError";
  }
}

/**
 * Solver đã dừng vì hết ngân sách tìm kiếm (thời gian hoặc số node).
 *
 * Đây là lỗi có cấu trúc từ solver (`search_limit`), khác với việc client
 * ngắt worker: giao diện có thể báo cho người dùng biết cần thử lại với
 * đề khác thay vì hiện một thông báo chung chung.
 */
export class SolverLimitError extends Error {
  constructor(message?: string) {
    super(message ?? "The solver reached its search budget.");
    this.name = "SolverLimitError";
  }
}

type WorkerMessage = {
  id: number;
  ok: boolean;
  output?: string;
  error?: string;
  code?: string;
};
type PendingTask = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: number;
};

let heavyWorker: Worker | null = null;
let nextId = 1;
const heavyPending = new Map<number, PendingTask>();

function rejectPending(tasks: Map<number, PendingTask>, reason: Error) {
  tasks.forEach(task => {
    window.clearTimeout(task.timer);
    task.reject(reason);
  });
  tasks.clear();
}

function resetHeavyWorker(reason: Error) {
  heavyWorker?.terminate();
  heavyWorker = null;
  rejectPending(heavyPending, reason);
}

export function cancelSolverInBrowser() {
  resetHeavyWorker(new SolverCancelledError());
}

function getHeavyWorker() {
  if (!heavyWorker) {
    heavyWorker = new Worker(new URL("./solverWorker.ts", import.meta.url), {
      type: "module",
    });
    heavyWorker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const task = heavyPending.get(event.data.id);
      if (!task) return;
      heavyPending.delete(event.data.id);
      window.clearTimeout(task.timer);
      if (event.data.ok && event.data.output) {
        try {
          task.resolve(JSON.parse(event.data.output));
        } catch (error) {
          task.reject(
            error instanceof Error
              ? error
              : new Error("Solver worker returned invalid JSON.")
          );
        }
      } else {
        task.reject(
          event.data.code === "search_limit"
            ? new SolverLimitError(event.data.error)
            : new Error(
                event.data.error ?? "Solver worker returned an empty response."
              )
        );
      }
    };
    heavyWorker.onerror = () => {
      resetHeavyWorker(
        new Error("Solver heavy worker failed to start or crashed.")
      );
    };
  }
  return heavyWorker;
}

function postTask<T>(
  tasks: Map<number, PendingTask>,
  getWorker: () => Worker,
  message: Record<string, unknown>,
  timeoutMs: number
): Promise<T> {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      const pendingTask = tasks.get(id);
      if (pendingTask) {
        tasks.delete(id);
        window.clearTimeout(pendingTask.timer);
        pendingTask.reject(new SolverTimeoutError());
      }
    }, timeoutMs);
    tasks.set(id, { resolve: value => resolve(value as T), reject, timer });
    try {
      getWorker().postMessage({ id, ...message });
    } catch (error) {
      tasks.delete(id);
      window.clearTimeout(timer);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

export function solveInBrowser(
  kind: "scramble" | "state",
  value: string,
  crossColor: CrossColor = "U",
  opening: OpeningMode = "cross",
  xcross: XCrossOptions = {},
  lastLayer: LastLayerMode = "auto",
  openingDepth = 8,
  openingFindResult = false,
  directNodeBudget = 5000
): Promise<SolverResult> {
  return postTask<SolverResult>(
    heavyPending,
    getHeavyWorker,
    {
      command: "solve",
      kind,
      value,
      crossColor,
      opening,
      lastLayer,
      openingDepth,
      openingFindResult,
      directNodeBudget,
      preferredSlot: xcross.preferredSlot,
      excludedSlots: xcross.excludedSlots ?? [],
    },
    SOLVER_TIMEOUT_MS
  );
}

export function warmSolverInBrowser(): Promise<void> {
  return postTask<void>(
    heavyPending,
    getHeavyWorker,
    { command: "warmup", value: "" },
    SOLVER_TIMEOUT_MS
  );
}

export function analyzeBldInBrowser(
  kind: "scramble" | "state",
  value: string
): Promise<BldResult> {
  return postTask<BldResult>(
    heavyPending,
    getHeavyWorker,
    { command: "bld", kind, value },
    SOLVER_TIMEOUT_MS
  );
}

export async function validateStateInBrowser(
  value: string
): Promise<CubeValidation> {
  // Thuần JavaScript trong trang (lib/cubeValidation.ts) — không cần worker.
  return validateCubeState(value);
}

export async function listLastLayerCasesInBrowser(
  filters: {
    family?: "all" | "zbll" | "1lll";
    group?: string;
    query?: string;
    limit?: number;
  } = {}
): Promise<LastLayerCatalogCase[]> {
  // Tải lười để ~230 KB dữ liệu catalog chỉ được tải khi mở Last Layer Study.
  const { listLastLayerDirectCases } = await import(
    "@/features/last-layer/lib/directCaseCatalog"
  );
  return listLastLayerDirectCases(filters);
}
