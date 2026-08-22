/** Xưởng Cơ Khí Tốc Độ — typed bridge to a non-blocking CFOP Web Worker. */
export type TraceStep = { index: number; phase: string; move: string; state: string };
export type PhaseResult = { name: string; algorithm: string; moves: string[]; state_after: string; valid_after: boolean; predicate_after: boolean; case_id: string | null; start: number; end: number };
export type OpeningTelemetry = { requested: string; target: string; achieved: string; attempts: string[]; fallback_count: number; did_fallback: boolean };
export type LastLayerMode = "oll_pll" | "zbll" | "1lll" | "auto";
export type LastLayerTelemetry = { requested: string; achieved: string; attempts: string[]; fallback_count: number; did_fallback: boolean };
export type SolverResult = { initial_state: string; final_state: string; algorithm: string; phases: PhaseResult[]; trace: TraceStep[]; opening: OpeningTelemetry; last_layer: LastLayerTelemetry };
export type CrossColor = "U" | "R" | "F" | "D" | "L" | "B";
export type OpeningMode = "cross" | "auto" | "xxcross" | "xxxcross" | "xxxxcross";
export type F2LSlot = "FR" | "FL" | "BL" | "BR";
export type XCrossOptions = { preferredSlot?: F2LSlot; excludedSlots?: F2LSlot[] };
export type CubeValidation = { valid: boolean; message: string };
export type LastLayerCatalogCase = { id: string; family: "zbll" | "1lll"; group: string; algorithm: string; state: string };

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (value: unknown) => void; reject: (reason: Error) => void }>();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("./solverWorker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<{ id: number; ok: boolean; output?: string; error?: string }>) => {
      const task = pending.get(event.data.id);
      if (!task) return;
      pending.delete(event.data.id);
      if (event.data.ok && event.data.output) task.resolve(JSON.parse(event.data.output));
      else task.reject(new Error(event.data.error ?? "Solver worker returned an empty response."));
    };
  }
  return worker;
}

export function solveInBrowser(kind: "scramble" | "state", value: string, crossColor: CrossColor = "U", opening: OpeningMode = "cross", xcross: XCrossOptions = {}, lastLayer: LastLayerMode = "auto"): Promise<SolverResult> {
  const id = nextId++;
  getWorker().postMessage({ id, command: "solve", kind, value, crossColor, opening, lastLayer, preferredSlot: xcross.preferredSlot, excludedSlots: xcross.excludedSlots ?? [] });
  return new Promise((resolve, reject) => pending.set(id, { resolve: (result) => resolve(result as SolverResult), reject }));
}

export function getCaseStateInBrowser(setup: string): Promise<string> {
  const id = nextId++;
  getWorker().postMessage({ id, command: "case", value: setup });
  return new Promise((resolve, reject) => pending.set(id, { resolve: (result) => resolve((result as { state: string }).state), reject }));
}

export function validateStateInBrowser(value: string): Promise<CubeValidation> {
  const id = nextId++;
  getWorker().postMessage({ id, command: "validate", value });
  return new Promise((resolve, reject) => pending.set(id, { resolve: (result) => resolve(result as CubeValidation), reject }));
}

export function listLastLayerCasesInBrowser(filters: { family?: "all" | "zbll" | "1lll"; group?: string; query?: string; limit?: number } = {}): Promise<LastLayerCatalogCase[]> {
  const id = nextId++;
  getWorker().postMessage({ id, command: "catalog", value: "", family: filters.family ?? "all", group: filters.group ?? "all", query: filters.query ?? "", limit: filters.limit ?? 120 });
  return new Promise((resolve, reject) => pending.set(id, { resolve: (result) => resolve((result as { cases: LastLayerCatalogCase[] }).cases), reject }));
}
