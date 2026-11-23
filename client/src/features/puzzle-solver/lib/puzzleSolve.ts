/**
 * Giải 2×2×2, Pyraminx và Skewb từ scramble bằng bộ tìm kiếm của cubing.js.
 *
 * `cubing/*` chỉ được nạp khi người dùng bấm "Giải" (import động tới module
 * cụ thể), nên không nằm trong chunk đầu. Phần logic (kiểm tra scramble, đếm
 * lượt) tách khỏi engine để kiểm thử mà không cần worker của cubing.js.
 */
import type { TimerEventId } from "@/lib/timerEvents";
import type { PuzzleId } from "@/features/puzzle-3d/lib/puzzleIds";

export type OtherPuzzleId = "222" | "pyram" | "skewb";

export type OtherPuzzleInfo = {
  eventId: TimerEventId;
  /** Id mô hình 3D. */
  puzzle: PuzzleId;
  labelKey: string;
};

export const OTHER_PUZZLES: Record<OtherPuzzleId, OtherPuzzleInfo> = {
  "222": { eventId: "222", puzzle: "2x2x2", labelKey: "otherPuzzles.puzzle.222" },
  pyram: { eventId: "pyram", puzzle: "pyraminx", labelKey: "otherPuzzles.puzzle.pyram" },
  skewb: { eventId: "skewb", puzzle: "skewb", labelKey: "otherPuzzles.puzzle.skewb" },
};

export const OTHER_PUZZLE_IDS = Object.keys(OTHER_PUZZLES) as OtherPuzzleId[];

export const MAX_SCRAMBLE_LENGTH = 400;

export type PuzzleSolveErrorCode = "empty" | "too-long" | "invalid-scramble" | "solver-failed";

export class PuzzleSolveError extends Error {
  constructor(
    readonly code: PuzzleSolveErrorCode,
    message?: string
  ) {
    super(message ?? code);
    this.name = "PuzzleSolveError";
  }
}

export type PuzzleSolveResult = {
  scramble: string;
  solution: string;
  moves: number;
};

/** Phần phụ thuộc cubing.js, thay được trong kiểm thử. */
export type SolveEngine = {
  /** Trả lời giải (chuỗi lượt) cho scramble đã chuẩn hoá; ném lỗi nếu scramble sai với khối này. */
  solve(puzzle: OtherPuzzleId, scramble: string): Promise<string>;
};

/** Gộp khoảng trắng, bỏ khoảng thừa đầu/cuối. */
export function normalizeScramble(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/** Số lượt trong một chuỗi lượt (mỗi từ là một lượt: R, U', r2, ...). */
export function countMoves(algorithm: string) {
  const text = algorithm.trim();
  return text ? text.split(/\s+/).length : 0;
}

/** Engine thật dựa trên cubing.js, nạp lười từng module. */
export const cubingEngine: SolveEngine = {
  async solve(puzzle, scramble) {
    const [{ Alg }, { puzzles }, search] = await Promise.all([
      import("cubing/alg"),
      import("cubing/puzzles"),
      import("cubing/search"),
    ]);
    const kpuzzleId = OTHER_PUZZLES[puzzle].puzzle as "2x2x2" | "pyraminx" | "skewb";
    const kpuzzle = await puzzles[kpuzzleId].kpuzzle();
    let pattern;
    try {
      pattern = kpuzzle.defaultPattern().applyAlg(new Alg(scramble));
    } catch (error) {
      throw new PuzzleSolveError("invalid-scramble", String(error));
    }
    const solve =
      puzzle === "222"
        ? search.experimentalSolve2x2x2
        : puzzle === "pyram"
          ? search.solvePyraminx
          : search.solveSkewb;
    return (await solve(pattern)).toString();
  },
};

/** Kiểm tra scramble rồi tìm lời giải. */
export async function solveOtherPuzzle(
  puzzle: OtherPuzzleId,
  rawScramble: string,
  engine: SolveEngine = cubingEngine
): Promise<PuzzleSolveResult> {
  const scramble = normalizeScramble(rawScramble);
  if (!scramble) throw new PuzzleSolveError("empty");
  if (scramble.length > MAX_SCRAMBLE_LENGTH) throw new PuzzleSolveError("too-long");
  let solution: string;
  try {
    solution = normalizeScramble(await engine.solve(puzzle, scramble));
  } catch (error) {
    if (error instanceof PuzzleSolveError) throw error;
    // Scramble không đọc được thường làm cubing.js ném lỗi cú pháp.
    throw new PuzzleSolveError(
      /parse|syntax|unknown|invalid|move/i.test(String(error))
        ? "invalid-scramble"
        : "solver-failed",
      String(error)
    );
  }
  return { scramble, solution, moves: countMoves(solution) };
}
