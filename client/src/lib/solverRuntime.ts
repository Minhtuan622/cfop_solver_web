/** Xưởng Cơ Khí Tốc Độ — typed bridge to the non-blocking CFOP solver worker.
 *
 * Một worker duy nhất đảm nhiệm solve, bld và warmup (tốn CPU): worker
 * Pyodide (`solverWorker.ts`, mặc định) hoặc worker WebAssembly
 * (`solverWorkerWasm.ts`) khi `VITE_SOLVER_ENGINE=wasm` — xem
 * `lib/solverEngine.ts`. Việc kiểm tra hợp lệ trạng thái (`validateStateInBrowser`)
 * chạy thuần JavaScript trong trang (`lib/cubeValidation.ts`), còn duyệt danh
 * mục case 1LLL/ZBLL (`listLastLayerCasesInBrowser`) đọc từ dữ liệu đã được
 * nhúng sẵn (`features/last-layer/lib/directCaseCatalog.ts`) — không cần
 * runtime Python.
 */
import { validateCubeState } from "./cubeValidation";
import {
  createSolverEngine,
  resolveSolverEngineName,
  type SolverEngine,
  type SolverProgress,
} from "./solverEngine";
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

export {
  SOLVER_TIMEOUT_MS,
  SolverCancelledError,
  SolverLimitError,
  SolverTimeoutError,
} from "./solverEngine";
export type { SolverEngine, SolverEngineName, SolverProgress } from "./solverEngine";

let engine: SolverEngine | null = null;

/** Engine đang dùng, chọn bằng `VITE_SOLVER_ENGINE` (mặc định pyodide). */
export function getSolverEngine(): SolverEngine {
  engine ??= createSolverEngine(
    resolveSolverEngineName(import.meta.env.VITE_SOLVER_ENGINE as string | undefined)
  );
  return engine;
}

export function cancelSolverInBrowser() {
  getSolverEngine().cancel();
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
  directNodeBudget = 5000,
  onProgress?: (progress: SolverProgress) => void
): Promise<SolverResult> {
  return getSolverEngine().solve(
    {
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
    onProgress
  );
}

export function warmSolverInBrowser(): Promise<void> {
  return getSolverEngine().warmup();
}

export function analyzeBldInBrowser(
  kind: "scramble" | "state",
  value: string
): Promise<BldResult> {
  return getSolverEngine().analyzeBld(kind, value);
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
