/** Xưởng Cơ Khí Tốc Độ — typed bridge to a non-blocking CFOP Web Worker. */
export type TraceStep = { index: number; phase: string; move: string; state: string };
export type PhaseResult = { name: string; algorithm: string; moves: string[]; state_after: string; valid_after: boolean; predicate_after: boolean; case_id: string | null; start: number; end: number };
export type SolverResult = { initial_state: string; final_state: string; algorithm: string; phases: PhaseResult[]; trace: TraceStep[] };

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (value: SolverResult) => void; reject: (reason: Error) => void }>();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("./solverWorker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<{ id: number; ok: boolean; output?: string; error?: string }>) => {
      const task = pending.get(event.data.id);
      if (!task) return;
      pending.delete(event.data.id);
      if (event.data.ok && event.data.output) task.resolve(JSON.parse(event.data.output) as SolverResult);
      else task.reject(new Error(event.data.error ?? "Solver worker returned an empty response."));
    };
  }
  return worker;
}

export function solveInBrowser(kind: "scramble" | "state", value: string): Promise<SolverResult> {
  const id = nextId++;
  getWorker().postMessage({ id, kind, value });
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
