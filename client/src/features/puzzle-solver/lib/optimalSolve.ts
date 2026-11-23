/**
 * Lời giải ngắn nhất (không theo CFOP) cho 3×3×3 để đặt cạnh lời giải CFOP.
 *
 * Trạng thái xuất phát được dựng lại từ chính lời giải CFOP: lời giải đưa khối
 * về trạng thái đã giải, nên đảo ngược nó rồi áp lên khối đã giải sẽ ra đúng
 * trạng thái ban đầu — dùng được cho cả nhập scramble lẫn nhập trạng thái.
 * Bộ tìm kiếm hai pha (Kociemba) của cubing.js cho lời giải thường 18–22 lượt.
 */
import { PuzzleSolveError, countMoves, normalizeScramble } from "./puzzleSolve";

export type OptimalEngine = {
  /** Trả lời giải ngắn cho trạng thái đạt được bằng cách áp `setupAlg` lên khối đã giải. */
  solveFromSetup(setupAlg: string): Promise<string>;
};

export type OptimalComparison = {
  solution: string;
  moves: number;
  /** Số lượt CFOP truyền vào, để so sánh. */
  cfopMoves: number;
  /** Số lượt CFOP nhiều hơn lời giải ngắn (≥ 0 nếu bộ giải hoạt động đúng). */
  extraMoves: number;
};

/** Số lượt mặt (HTM) của một chuỗi: không tính phép xoay cả khối x/y/z. */
export function countFaceMoves(algorithm: string) {
  return normalizeScramble(algorithm)
    .split(" ")
    .filter(move => move && !/^[xyz]/.test(move)).length;
}

export const cubingOptimalEngine: OptimalEngine = {
  async solveFromSetup(setupAlg) {
    const [{ Alg }, { puzzles }, { experimentalSolve3x3x3IgnoringCenters }] =
      await Promise.all([
        import("cubing/alg"),
        import("cubing/puzzles"),
        import("cubing/search"),
      ]);
    const kpuzzle = await puzzles["3x3x3"].kpuzzle();
    let pattern;
    try {
      pattern = kpuzzle.defaultPattern().applyAlg(new Alg(setupAlg));
    } catch (error) {
      throw new PuzzleSolveError("invalid-scramble", String(error));
    }
    return (await experimentalSolve3x3x3IgnoringCenters(pattern)).toString();
  },
};

/** Đảo một chuỗi lượt bằng cubing.js khi có, hoặc thủ công cho kiểm thử. */
export function invertAlgorithm(algorithm: string) {
  return normalizeScramble(algorithm)
    .split(" ")
    .filter(Boolean)
    .reverse()
    .map(move =>
      move.endsWith("'") ? move.slice(0, -1) : move.endsWith("2") ? move : `${move}'`
    )
    .join(" ");
}

export async function compareWithOptimal(
  cfopSolution: string,
  engine: OptimalEngine = cubingOptimalEngine
): Promise<OptimalComparison> {
  const cfop = normalizeScramble(cfopSolution);
  if (!cfop) throw new PuzzleSolveError("empty");
  let solution: string;
  try {
    solution = normalizeScramble(await engine.solveFromSetup(invertAlgorithm(cfop)));
  } catch (error) {
    if (error instanceof PuzzleSolveError) throw error;
    throw new PuzzleSolveError("solver-failed", String(error));
  }
  const cfopMoves = countFaceMoves(cfop);
  const moves = countFaceMoves(solution);
  return { solution, moves, cfopMoves, extraMoves: cfopMoves - moves };
}
