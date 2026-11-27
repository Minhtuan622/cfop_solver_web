import { Move } from "cubing/alg";
import {
  MINX_MOVE_NAMES,
  MinxUnavailableError,
  solveMinxPattern,
  type MinxMoves,
  type MinxPattern,
  type MinxPhase,
} from "./megaminxSolver";
import type { MinxWorkerResponse } from "./megaminxWorker";

export type MegaminxSolution = { solution: string; phases: MinxPhase[] };

async function runInWorker(pattern: MinxPattern, moves: MinxMoves) {
  const worker = new Worker(new URL("./megaminxWorker.ts", import.meta.url), { type: "module" });
  try {
    return await new Promise<{ phases: MinxPhase[]; rotation: string[] }>((resolve, reject) => {
      worker.onmessage = (event: MessageEvent<MinxWorkerResponse>) => {
        if (event.data.ok) resolve(event.data);
        else reject(new MinxUnavailableError(event.data.error));
      };
      worker.onerror = event => reject(new MinxUnavailableError(event.message));
      worker.postMessage({ id: 1, pattern, moves });
    });
  } finally {
    worker.terminate();
  }
}

// Solves a megaminx pattern layer by layer. Throws MinxUnavailableError when
// the method cannot finish, so the caller can fall back to the shortest search.
export async function solveMegaminxLayers(patternData: MinxPattern | null, scramble: string | null) {
  const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
  const kpuzzle = await puzzles.megaminx.kpuzzle();
  const pattern = (patternData ??
    kpuzzle.defaultPattern().applyAlg(new Alg(scramble ?? "")).patternData) as unknown as MinxPattern;
  const moves = Object.fromEntries(
    MINX_MOVE_NAMES.map(name => [name, kpuzzle.moveToTransformation(new Move(name)).transformationData])
  ) as unknown as MinxMoves;

  const { phases, rotation } =
    typeof Worker === "undefined"
      ? solveMinxPattern(pattern, name => moves[name])
      : await runInWorker(pattern, moves);
  const all: MinxPhase[] = rotation.length ? [{ name: "Rotation", moves: rotation }, ...phases] : phases;
  return { solution: all.flatMap(phase => phase.moves).join(" "), phases: all } satisfies MegaminxSolution;
}
