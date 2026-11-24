import {
  applyFastMoves,
  FAST_MOVE_NAMES,
  invertAlgorithm,
  parseFastMoves,
  SOLVED_FAST_STATE,
} from "./fastCube";
import type { CrossColor, SolverResult } from "./solverRuntime";

const WCA_SCRAMBLE_FRAME = "z2";

export const CROSS_TO_D_ROTATION: Record<CrossColor, string> = {
  U: "z2",
  R: "z",
  F: "x'",
  D: "",
  L: "z'",
  B: "x",
};

export function studioScrambleAlg(scramble: string): string {
  const moves = scramble.trim();
  return moves ? `${WCA_SCRAMBLE_FRAME} ${moves} ${WCA_SCRAMBLE_FRAME}` : "";
}

export function scrambledState(scramble: string): string {
  return applyFastMoves(SOLVED_FAST_STATE, studioScrambleAlg(scramble));
}

export function orientForCross(state: string, crossColor: CrossColor): string {
  const rotation = CROSS_TO_D_ROTATION[crossColor];
  return rotation ? applyFastMoves(state, rotation) : state;
}

export function previewSetupAlg(
  scramble: string,
  crossColor: CrossColor
): string {
  return [studioScrambleAlg(scramble), CROSS_TO_D_ROTATION[crossColor]]
    .filter(Boolean)
    .join(" ");
}

const WCA_TO_STUDIO_LETTER: Record<string, string> = {
  U: "D",
  D: "U",
  R: "L",
  L: "R",
  F: "F",
  B: "B",
};
export function wcaLettersToStudio(state: string): string {
  return state.replace(/[URFDLB]/g, letter => WCA_TO_STUDIO_LETTER[letter]);
}

const LABELED_STATE = Array.from({ length: 54 }, (_, index) =>
  String.fromCharCode(0x4e00 + index)
).join("");
const effect = (alg: string) => applyFastMoves(LABELED_STATE, alg);

const ROTATION_CANDIDATES = (() => {
  const single = ["x", "x'", "x2", "y", "y'", "y2", "z", "z'", "z2"];
  return ["", ...single, ...single.flatMap(a => single.map(b => `${a} ${b}`))];
})();

export function rotationBetween(from: string, to: string): string {
  const target = effect(to);
  const found = ROTATION_CANDIDATES.find(
    candidate => effect(`${from} ${candidate}`) === target
  );
  if (found === undefined)
    throw new Error(`No rotation from "${from}" to "${to}"`);
  return found;
}

export function solutionSetupRotation(
  crossColor: CrossColor,
  from: "scramble" | "state"
): string {
  return rotationBetween(
    from === "scramble" ? WCA_SCRAMBLE_FRAME : "",
    CROSS_TO_D_ROTATION[crossColor]
  );
}

const heldMoveCache = new Map<string, Map<string, string>>();

export function heldMove(move: string, crossColor: CrossColor): string {
  const rotation = CROSS_TO_D_ROTATION[crossColor];
  if (!rotation) return move;
  let table = heldMoveCache.get(crossColor);
  if (!table) {
    table = new Map();
    heldMoveCache.set(crossColor, table);
  }
  const cached = table.get(move);
  if (cached !== undefined) return cached;
  const [normalized] = parseFastMoves(move);
  const target = effect(normalized);
  const inverse = invertAlgorithm(rotation);
  const match = FAST_MOVE_NAMES.find(
    candidate => effect(`${rotation} ${candidate} ${inverse}`) === target
  );
  const written =
    match === undefined
      ? move
      : /^[URFDLB]w/.test(move) && /^[urfdlb]/.test(match)
        ? match[0].toUpperCase() + "w" + match.slice(1)
        : match;
  table.set(move, written);
  return written;
}

export function heldAlgorithm(alg: string, crossColor: CrossColor): string {
  return alg
    .split(/\s+/)
    .filter(Boolean)
    .map(move => heldMove(move, crossColor))
    .join(" ");
}

export function heldNotationResult(
  result: SolverResult,
  crossColor: CrossColor
): SolverResult {
  if (!CROSS_TO_D_ROTATION[crossColor]) return result;
  return {
    ...result,
    algorithm: heldAlgorithm(result.algorithm, crossColor),
    phases: result.phases.map(phase => ({
      ...phase,
      algorithm: heldAlgorithm(phase.algorithm, crossColor),
      moves: phase.moves.map(move => heldMove(move, crossColor)),
    })),
    trace: result.trace.map(step => ({
      ...step,
      move: heldMove(step.move, crossColor),
    })),
  };
}
