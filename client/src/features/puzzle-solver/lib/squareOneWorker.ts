import { solveSquareOneState, type SquareOnePhase } from "./squareOneSolver";

export type SquareOneWorkerRequest = { id: number; state: number[]; equatorFlipped: boolean };
export type SquareOneWorkerResponse =
  | { id: number; ok: true; phases: SquareOnePhase[] }
  | { id: number; ok: false; error: string };

self.onmessage = (event: MessageEvent<SquareOneWorkerRequest>) => {
  const { id, state, equatorFlipped } = event.data;
  try {
    const phases = solveSquareOneState(state, { equatorFlipped });
    (self as unknown as Worker).postMessage({ id, ok: true, phases } satisfies SquareOneWorkerResponse);
  } catch (error) {
    (self as unknown as Worker).postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.name : String(error),
    } satisfies SquareOneWorkerResponse);
  }
};
