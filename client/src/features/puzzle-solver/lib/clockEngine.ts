/**
 * Clock: nối bộ giải số học (`clockSolver`) với KPuzzle của cubing.js. Véc-tơ
 * của từng lượt và hoán vị của `y2` đọc thẳng từ KPuzzle nên khớp bộ vẽ và
 * bộ phát lời giải; lời giải luôn được áp lại để kiểm.
 */
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
      // Sau `y2` các lượt vẫn tác động lên cùng các ô (theo vị trí), nên là cùng véc-tơ.
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

/** 18 mặt số (đơn vị giờ, 0–11) của một lời tráo, theo thứ tự ô của KPuzzle. */
export async function dialsFromScramble(scramble: string): Promise<number[]> {
  const { kpuzzle, Alg } = await loadClock();
  return dialsOf(kpuzzle.defaultPattern().applyAlg(new Alg(scramble))).orientation.slice();
}

export type ClockSolveOutcome = { solution: string; setup: string };

/** Tìm lời giải cho 18 mặt số; kiểm lại bằng KPuzzle; `null` nếu vô nghiệm. */
export async function solveClockDials(dials: number[]): Promise<string | null> {
  const { kpuzzle, Alg, model } = await loadClock();
  const result = solveClock(model, dials);
  if (!result) return null;
  const solution = result.moves.join(" ");
  // Dựng lại trạng thái từ dials rồi áp lời giải để chắc chắn về 12 giờ.
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
