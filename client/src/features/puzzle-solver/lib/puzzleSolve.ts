/**
 * Giải 2×2×2, Pyraminx và Skewb từ scramble bằng bộ tìm kiếm của cubing.js.
 *
 * `cubing/*` chỉ được nạp khi người dùng bấm "Giải" (import động tới module
 * cụ thể), nên không nằm trong chunk đầu. Phần logic (kiểm tra scramble, đếm
 * lượt) tách khỏi engine để kiểm thử mà không cần worker của cubing.js.
 */
import type { TimerEventId } from "@/lib/timerEvents";
import type { PuzzleId } from "@/features/puzzle-3d/lib/puzzleIds";

export type OtherPuzzleId = "222" | "pyram" | "skewb" | "minx" | "333fm" | "333roux";

export type OtherPuzzleInfo = {
  eventId: TimerEventId;
  /** Event dùng để tạo scramble ngẫu nhiên (FM dùng scramble 3×3 thường). */
  scrambleEventId: TimerEventId;
  /** Có hiện trong dropdown chọn khối không (3×3 FM là tab của 3×3 nên không). */
  inPicker: boolean;
  /** Id mô hình 3D. */
  puzzle: PuzzleId;
  labelKey: string;
};

export const OTHER_PUZZLES: Record<OtherPuzzleId, OtherPuzzleInfo> = {
  "222": { eventId: "222", scrambleEventId: "222", inPicker: true, puzzle: "2x2x2", labelKey: "otherPuzzles.puzzle.222" },
  pyram: { eventId: "pyram", scrambleEventId: "pyram", inPicker: true, puzzle: "pyraminx", labelKey: "otherPuzzles.puzzle.pyram" },
  skewb: { eventId: "skewb", scrambleEventId: "skewb", inPicker: true, puzzle: "skewb", labelKey: "otherPuzzles.puzzle.skewb" },
  minx: { eventId: "minx", scrambleEventId: "minx", inPicker: true, puzzle: "megaminx", labelKey: "otherPuzzles.puzzle.minx" },
  "333roux": { eventId: "333", scrambleEventId: "333", inPicker: true, puzzle: "3x3x3", labelKey: "otherPuzzles.puzzle.333roux" },
  "333fm": { eventId: "333fm", scrambleEventId: "333", inPicker: false, puzzle: "3x3x3", labelKey: "otherPuzzles.puzzle.333fm" },
};

/** Thứ tự trong dropdown (không dựa vào thứ tự khoá object: "222" là khoá số nên luôn đứng đầu). */
const PICKER_ORDER: OtherPuzzleId[] = ["333roux", "222", "pyram", "skewb", "minx", "333fm"];
export const OTHER_PUZZLE_IDS = PICKER_ORDER.filter(id => OTHER_PUZZLES[id].inPicker);

export const MAX_SCRAMBLE_LENGTH = 400;

export type PuzzleSolveErrorCode =
  | "empty"
  | "too-long"
  | "invalid-scramble"
  | "invalid-state"
  | "solver-failed";

export class PuzzleSolveError extends Error {
  constructor(
    readonly code: PuzzleSolveErrorCode,
    message?: string
  ) {
    super(message ?? code);
    this.name = "PuzzleSolveError";
  }
}

/** Một giai đoạn của lời giải (Roux: FB, SB, CMLL, LSE). */
export type SolutionPhase = { name: string; moves: string[] };

export type PuzzleSolveResult = {
  scramble: string;
  solution: string;
  moves: number;
  /** Có khi bộ giải chia lời giải theo giai đoạn. */
  phases?: SolutionPhase[];
};

/** Phần phụ thuộc cubing.js, thay được trong kiểm thử. */
export type SolveEngine = {
  /** Có với khối giải theo giai đoạn (Roux): trả cả lời giải lẫn các giai đoạn. */
  solveWithPhases?(
    puzzle: OtherPuzzleId,
    scramble: string
  ): Promise<{ solution: string; phases: SolutionPhase[] }>;
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

type SearchModule = typeof import("cubing/search");
type SolverFn = (pattern: Parameters<SearchModule["solvePyraminx"]>[0]) => ReturnType<SearchModule["solvePyraminx"]>;

/** Hàm tìm lời giải của cubing.js ứng với từng khối. */
export function pickSolver(search: SearchModule, puzzle: OtherPuzzleId): SolverFn {
  if (puzzle === "222") return search.experimentalSolve2x2x2;
  // 3×3 Roux có bộ giải riêng (features/roux), không đi qua đây.
  // 3×3 FM dùng bộ hai pha (Kociemba): lời giải ngắn, thường 18–22 nước.
  if (puzzle === "333fm")
    return search.experimentalSolve3x3x3IgnoringCenters;
  if (puzzle === "pyram") return search.solvePyraminx;
  if (puzzle === "minx") return search.solveMegaminx;
  return search.solveSkewb;
}

/**
 * Đảo một chuỗi lượt: đi ngược lại và lật chiều từng nước. `fifthTurns` cho
 * Megaminx, nơi "2" là 2/5 vòng (đảo thành "2'") chứ không phải nửa vòng.
 */
export function invertAlgorithm(algorithm: string, options: { fifthTurns?: boolean } = {}) {
  return normalizeScramble(algorithm)
    .split(" ")
    .filter(Boolean)
    .reverse()
    .map(move =>
      // Megaminx: R++ ↔ R--; còn lại đảo dấu nháy, nửa vòng giữ nguyên.
      move.endsWith("++")
        ? `${move.slice(0, -2)}--`
        : move.endsWith("--")
          ? `${move.slice(0, -2)}++`
          : move.endsWith("'")
            ? move.slice(0, -1)
            : move.endsWith("2") && !options.fifthTurns
              ? move
              : `${move}'`
    )
    .join(" ");
}

/** Engine thật dựa trên cubing.js, nạp lười từng module. */
export const cubingEngine: SolveEngine = {
  async solveWithPhases(puzzle, scramble) {
    if (puzzle !== "333roux") throw new PuzzleSolveError("solver-failed");
    const { solveRouxScramble } = await import("@/features/roux/lib/rouxEngine");
    try {
      const result = await solveRouxScramble(scramble);
      return { solution: result.moves.join(" "), phases: result.phases };
    } catch (error) {
      throw new PuzzleSolveError(
        /parse|syntax|unknown|invalid|move/i.test(String(error)) ? "invalid-scramble" : "solver-failed",
        String(error)
      );
    }
  },
  async solve(puzzle, scramble) {
    const [{ Alg }, { puzzles }, search] = await Promise.all([
      import("cubing/alg"),
      import("cubing/puzzles"),
      import("cubing/search"),
    ]);
    const kpuzzleId = OTHER_PUZZLES[puzzle].puzzle as "2x2x2" | "3x3x3" | "pyraminx" | "skewb" | "megaminx";
    const kpuzzle = await puzzles[kpuzzleId].kpuzzle();
    let pattern;
    try {
      pattern = kpuzzle.defaultPattern().applyAlg(new Alg(scramble));
    } catch (error) {
      throw new PuzzleSolveError("invalid-scramble", String(error));
    }
    return (await pickSolver(search, puzzle)(pattern)).toString();
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
  let phases: SolutionPhase[] | undefined;
  try {
    if (puzzle === "333roux" && engine.solveWithPhases) {
      const detailed = await engine.solveWithPhases(puzzle, scramble);
      solution = normalizeScramble(detailed.solution);
      phases = detailed.phases;
    } else solution = normalizeScramble(await engine.solve(puzzle, scramble));
  } catch (error) {
    if (error instanceof PuzzleSolveError) throw error;
    console.warn(`[puzzle-solve] ${puzzle} failed`, error);
    // Scramble không đọc được thường làm cubing.js ném lỗi cú pháp.
    throw new PuzzleSolveError(
      /parse|syntax|unknown|invalid|move/i.test(String(error))
        ? "invalid-scramble"
        : "solver-failed",
      String(error)
    );
  }
  return { scramble, solution, moves: countMoves(solution), ...(phases ? { phases } : {}) };
}
