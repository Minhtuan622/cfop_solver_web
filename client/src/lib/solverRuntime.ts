/** Xưởng Cơ Khí Tốc Độ — typed bridge to non-blocking CFOP Web Workers.
 *
 * Hai tác vụ được tách thành hai worker riêng:
 * - worker NẰNG (`solverWorker.ts`): solve, bld, warmup (dùng Pyodide, tốn CPU).
 * - worker NHẸ (`solverLiteWorker.ts`): validate, catalog (dùng Pyodide riêng).
 *
 * Mỗi worker có bản cache Pyodide riêng, nên việc tải/hủy Pyodide của một
 * bên không làm hủy tác vụ đang chạy của bên kia (ví dụ: hủy giải không làm
 * gián đoạn kiểm tra trạng thái, và ngược lại).
 */
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
  "cross" | "auto" | "xxcross" | "xxxcross" | "xxxxcross";
export type F2LSlot = "FR" | "FL" | "BL" | "BR";
export type XCrossOptions = {
  preferredSlot?: F2LSlot;
  excludedSlots?: F2LSlot[];
};
export type CubeValidation = { valid: boolean; message: string };
export type LastLayerCatalogCase = {
  id: string;
  family: "zbll" | "1lll";
  group: string;
  algorithm: string;
  state: string;
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
  final_state: string;
  algorithm: string;
  phases: PhaseResult[];
  trace: TraceStep[];
  opening: OpeningTelemetry;
  last_layer: LastLayerTelemetry;
  analysis: BldAnalysis;
  solved: boolean;
};
export type BldAnalysis = {
  method: string;
  buffers: {
    edge: { letter: string; position: string };
    corner: { letter: string; position: string };
  };
  edges: { cycles: string[]; memo: string[]; execution_keys: string[] };
  corners: { cycles: string[]; memo: string[]; execution_keys: string[] };
  special: {
    parity: boolean;
    edge_flips: string[];
    corner_twists: { position: string; direction: "cw" | "ccw" }[];
    edge_orientation_sum: number;
    corner_orientation_sum: number;
  };
  solved: boolean;
};

export const SOLVER_TIMEOUT_MS = 45000;
export const VALIDATE_TIMEOUT_MS = 15000;

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
let lightWorker: Worker | null = null;
let nextId = 1;
const heavyPending = new Map<number, PendingTask>();
const lightPending = new Map<number, PendingTask>();

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

function resetLightWorker(reason: Error) {
  lightWorker?.terminate();
  lightWorker = null;
  rejectPending(lightPending, reason);
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

function getLightWorker() {
  if (!lightWorker) {
    lightWorker = new Worker(
      new URL("./solverLiteWorker.ts", import.meta.url),
      { type: "module" }
    );
    lightWorker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const task = lightPending.get(event.data.id);
      if (!task) return;
      lightPending.delete(event.data.id);
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
    lightWorker.onerror = () => {
      resetLightWorker(
        new Error("Solver light worker failed to start or crashed.")
      );
    };
  }
  return lightWorker;
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

export function cancelSolverInBrowser() {
  resetHeavyWorker(new SolverCancelledError());
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

export function validateStateInBrowser(value: string): Promise<CubeValidation> {
  return postTask<CubeValidation>(
    lightPending,
    getLightWorker,
    { command: "validate", value },
    VALIDATE_TIMEOUT_MS
  );
}

export function listLastLayerCasesInBrowser(
  filters: {
    family?: "all" | "zbll" | "1lll";
    group?: string;
    query?: string;
    limit?: number;
  } = {}
): Promise<LastLayerCatalogCase[]> {
  return postTask<{ cases: LastLayerCatalogCase[] }>(
    lightPending,
    getLightWorker,
    {
      command: "catalog",
      value: "",
      family: filters.family ?? "all",
      group: filters.group ?? "all",
      query: filters.query ?? "",
      limit: filters.limit ?? 120,
    },
    30000
  ).then(result => result.cases);
}
