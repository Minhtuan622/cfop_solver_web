import { solveMinxPattern, type MinxMoves, type MinxPattern, type MinxPhase } from "./megaminxSolver";

export type MinxWorkerRequest = { id: number; pattern: MinxPattern; moves: MinxMoves };
export type MinxWorkerResponse =
  | { id: number; ok: true; phases: MinxPhase[]; rotation: string[] }
  | { id: number; ok: false; error: string };

self.onmessage = (event: MessageEvent<MinxWorkerRequest>) => {
  const { id, pattern, moves } = event.data;
  try {
    const { phases, rotation } = solveMinxPattern(pattern, name => moves[name]);
    (self as unknown as Worker).postMessage({ id, ok: true, phases, rotation } satisfies MinxWorkerResponse);
  } catch (error) {
    (self as unknown as Worker).postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.name : String(error),
    } satisfies MinxWorkerResponse);
  }
};
