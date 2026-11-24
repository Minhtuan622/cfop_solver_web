import {
  CLOCK_MOVE_NAMES,
  solveClock,
  type ClockModel,
  type ClockMoveName,
} from "./clockSolver";

export const CLOCK_DIAL_COUNT = 18;

type LoadedClock = {
  kpuzzle: Awaited<ReturnType<Awaited<ReturnType<typeof importPuzzles>>["puzzles"]["clock"]["kpuzzle"]>>;
  Alg: typeof import("cubing/alg").Alg;
  model: ClockModel;
};

const importPuzzles = () => import("cubing/puzzles");
let loading: Promise<LoadedClock> | null = null;

type DialData = { pieces: number[]; orientation: number[] };
const dialsOf = (pattern: { patternData: unknown }) =>
  (pattern.patternData as { DIALS: DialData }).DIALS;

export function loadClock(): Promise<LoadedClock> {
  loading ??= (async () => {
    const [{ puzzles }, { Alg }] = await Promise.all([importPuzzles(), import("cubing/alg")]);
    const kpuzzle = await puzzles.clock.kpuzzle();
    const solved = kpuzzle.defaultPattern();
    const front = {} as Record<ClockMoveName, number[]>;
    const back = {} as Record<ClockMoveName, number[]>;
    for (const name of CLOCK_MOVE_NAMES) {
      front[name] = dialsOf(solved.applyAlg(new Alg(`${name}1+`))).orientation;
      back[name] = dialsOf(solved.applyAlg(new Alg(`y2 ${name}1+`))).orientation;
    }
    const flipped = dialsOf(solved.applyAlg(new Alg("y2")));
    const model: ClockModel = {
      front,
      back,
      flip: { permutation: flipped.pieces, delta: flipped.orientation },
    };
    return { kpuzzle, Alg, model };
  })();
  return loading;
}

export async function dialsFromScramble(scramble: string): Promise<number[]> {
  const { kpuzzle, Alg } = await loadClock();
  return dialsOf(kpuzzle.defaultPattern().applyAlg(new Alg(scramble))).orientation.slice();
}

export type ClockSolveOutcome = { solution: string; setup: string };

export async function solveClockDials(dials: number[]): Promise<string | null> {
  const { kpuzzle, Alg, model } = await loadClock();
  const result = solveClock(model, dials);
  if (!result) return null;
  const solution = result.moves.join(" ");
  const pattern = kpuzzle.defaultPattern();
  const data = structuredClone(pattern.patternData) as { DIALS: DialData };
  data.DIALS.orientation = dials.slice();
  const start = new (pattern.constructor as new (k: unknown, d: unknown) => typeof pattern)(
    kpuzzle,
    data
  );
  const after = dialsOf(start.applyAlg(new Alg(solution))).orientation;
  return after.every(value => value === 0) ? solution : null;
}
