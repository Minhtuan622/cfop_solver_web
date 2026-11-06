/** Xưởng Cơ Khí Tốc Độ — typed bridge to a non-blocking CFOP Web Worker. */
export type TraceStep = { index: number; phase: string; move: string; state: string };
export type PhaseResult = { name: string; algorithm: string; moves: string[]; state_after: string; valid_after: boolean; predicate_after: boolean; case_id: string | null; start: number; end: number };
export type DirectAttempt = { slots: F2LSlot[]; nodes: number; budget: number; depth: number; status: "solved" | "budget" | "no_solution" };
export type OpeningTelemetry = { requested: string; target: string; achieved: string; attempts: string[]; method?: "direct" | "expanded" | "unavailable" | "staged"; fallback_count: number; did_fallback: boolean; direct_search?: { node_budget: number; attempts: DirectAttempt[] } };
export type LastLayerMode = "oll_pll" | "zbll" | "1lll" | "auto";
export type LastLayerTelemetry = { requested: string; achieved: string; attempts: string[]; case_id?: string | null; fallback_count: number; did_fallback: boolean };
export type SolverResult = { initial_state: string; final_state: string; algorithm: string; phases: PhaseResult[]; trace: TraceStep[]; opening: OpeningTelemetry; last_layer: LastLayerTelemetry };
export type CrossColor = "U" | "R" | "F" | "D" | "L" | "B";
export type OpeningMode = "cross" | "auto" | "xxcross" | "xxxcross" | "xxxxcross";
export type F2LSlot = "FR" | "FL" | "BL" | "BR";
export type XCrossOptions = { preferredSlot?: F2LSlot; excludedSlots?: F2LSlot[] };
export type CubeValidation = { valid: boolean; message: string };
export type LastLayerCatalogCase = { id: string; family: "zbll" | "1lll"; group: string; algorithm: string; state: string };
export type BldCycle = { buffer: string; targets: string[]; cycle_break: boolean; memo: string; execution_keys: string[] };
export type BldResult = { initial_state: string; analysis: { method: "3style-speffz"; buffers: { edge: { letter: string; position: string }; corner: { letter: string; position: string } }; edges: { cycles: BldCycle[]; memo: string[]; execution_keys: string[] }; corners: { cycles: BldCycle[]; memo: string[]; execution_keys: string[] }; special: { parity: boolean; edge_flips: string[]; corner_twists: { position: string; direction: "cw" | "ccw" }[]; edge_orientation_sum: number; corner_orientation_sum: number }; solved: boolean; catalog: { provider: string; source: string; note: string } } };

export const SOLVER_TIMEOUT_MS = 45_000;

export class SolverCancelledError extends Error {
  constructor() {
    super("Solver request cancelled.");
    this.name = "SolverCancelledError";
  }
}

export class SolverTimeoutError extends Error {
  constructor() {
    super(`Solver request exceeded ${SOLVER_TIMEOUT_MS}ms.`);
    this.name = "SolverTimeoutError";
  }
}

type WorkerMessage = { id: number; ok: boolean; output?: string; error?: string };
type PendingTask = { resolve: (value: unknown) => void; reject: (reason: Error) => void; timer: number };
let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, PendingTask>();

function rejectPending(reason: Error) {
  pending.forEach((task) => {
    window.clearTimeout(task.timer);
    task.reject(reason);
  });
  pending.clear();
}

function resetWorker(reason: Error) {
  worker?.terminate();
  worker = null;
  rejectPending(reason);
}

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("./solverWorker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const task = pending.get(event.data.id);
      if (!task) return;
      pending.delete(event.data.id);
      window.clearTimeout(task.timer);
      if (event.data.ok && event.data.output) {
        try {
          task.resolve(JSON.parse(event.data.output));
        } catch (error) {
          task.reject(error instanceof Error ? error : new Error("Solver worker returned invalid JSON."));
        }
      } else task.reject(new Error(event.data.error ?? "Solver worker returned an empty response."));
    };
    worker.onerror = (event) => {
      event.preventDefault();
      resetWorker(new Error("Solver worker failed to start or crashed."));
    };
  }
  return worker;
}

function postTask<T>(message: Record<string, unknown>, timeoutMs: number): Promise<T> {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => resetWorker(new SolverTimeoutError()), timeoutMs);
    pending.set(id, { resolve: (value) => resolve(value as T), reject, timer });
    try {
      getWorker().postMessage({ id, ...message });
    } catch (error) {
      pending.delete(id);
      window.clearTimeout(timer);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

/** Cancel the active solver request and restart a clean worker for the next request. */
export function cancelSolverInBrowser() {
  if (worker) resetWorker(new SolverCancelledError());
}

export function solveInBrowser(kind: "scramble" | "state", value: string, crossColor: CrossColor = "U", opening: OpeningMode = "cross", xcross: XCrossOptions = {}, lastLayer: LastLayerMode = "auto", openingDepth = 8, openingFindResult = false, directNodeBudget = 5000): Promise<SolverResult> {
  return postTask<SolverResult>({ command: "solve", kind, value, crossColor, opening, lastLayer, openingDepth, openingFindResult, directNodeBudget, preferredSlot: xcross.preferredSlot, excludedSlots: xcross.excludedSlots ?? [] }, SOLVER_TIMEOUT_MS);
}

export function warmSolverInBrowser(): Promise<void> {
  return postTask<void>({ command: "warmup", value: "" }, SOLVER_TIMEOUT_MS);
}

export function analyzeBldInBrowser(kind: "scramble" | "state", value: string): Promise<BldResult> {
  return postTask<BldResult>({ command: "bld", kind, value }, SOLVER_TIMEOUT_MS);
}

export function validateStateInBrowser(value: string): Promise<CubeValidation> {
  return postTask<CubeValidation>({ command: "validate", value }, 15_000);
}

export function listLastLayerCasesInBrowser(filters: { family?: "all" | "zbll" | "1lll"; group?: string; query?: string; limit?: number } = {}): Promise<LastLayerCatalogCase[]> {
  return postTask<{ cases: LastLayerCatalogCase[] }>({ command: "catalog", value: "", family: filters.family ?? "all", group: filters.group ?? "all", query: filters.query ?? "", limit: filters.limit ?? 120 }, 30_000).then((result) => result.cases);
}
