import {
  SquareOneStateError,
  assertSquareOneState,
} from "@/lib/squareOneModel";
import {
  SquareOneUnavailableError,
  solveSquareOneState,
  type SquareOnePhase,
} from "./squareOneSolver";
import type { SquareOneWorkerResponse } from "./squareOneWorker";

type SquareOnePattern = {
  WEDGES: { pieces: number[] };
  EQUATOR: { orientation: number[] };
};

export type SquareOneSolution = { solution: string; phases: SquareOnePhase[] };

// Reads cubing's square1 pattern for a scramble written as `(a,b)/ (a,b)/ ...`.
export async function squareOneStateFromScramble(scramble: string) {
  const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
  const kpuzzle = await puzzles.square1.kpuzzle();
  const data = kpuzzle.defaultPattern().applyAlg(new Alg(scramble)).patternData as unknown as SquareOnePattern;
  const state = [...data.WEDGES.pieces];
  assertSquareOneState(state);
  return { state, equatorFlipped: data.EQUATOR.orientation[1] !== 0 };
}

function runInWorker(state: number[], equatorFlipped: boolean) {
  const worker = new Worker(new URL("./squareOneWorker.ts", import.meta.url), { type: "module" });
  return new Promise<SquareOnePhase[]>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<SquareOneWorkerResponse>) => {
      if (event.data.ok) resolve(event.data.phases);
      else reject(new SquareOneUnavailableError(event.data.error));
    };
    worker.onerror = event => reject(new SquareOneUnavailableError(event.message));
    worker.postMessage({ id: 1, state, equatorFlipped });
  }).finally(() => worker.terminate());
}

export async function solveSquareOneScramble(scramble: string): Promise<SquareOneSolution> {
  const { state, equatorFlipped } = await squareOneStateFromScramble(scramble);
  const phases =
    typeof Worker === "undefined"
      ? solveSquareOneState(state, { equatorFlipped })
      : await runInWorker(state, equatorFlipped);
  return { solution: phases.flatMap(phase => phase.moves).join(" "), phases };
}

export { SquareOneStateError, SquareOneUnavailableError };
