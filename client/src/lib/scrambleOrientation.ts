/**
 * Hướng cầm khối khi tráo và sau khi tráo.
 *
 * Quy ước của studio: chữ cái mặt là vị trí trong khung giải CFOP — vàng ở U,
 * trắng ở D, xanh lá ở F (xem `cubeColors.ts`). Nhưng scramble WCA được thực
 * hiện khi cầm **trắng U, xanh lá F**, tức khung studio xoay `z2`. Vì vậy trạng
 * thái thật sau khi tráo là `z2 <scramble> z2` trong khung studio: các lượt
 * U/R của scramble xoay mặt trắng/đỏ như trên khối thật.
 *
 * Sau khi tráo, người dùng lật khối để màu cross đã chọn nằm ở D; phép xoay
 * cho từng màu trùng với khung của bộ giải Rust (`CROSS_ROTATIONS`).
 */
import {
  applyFastMoves,
  FAST_MOVE_NAMES,
  invertAlgorithm,
  parseFastMoves,
  SOLVED_FAST_STATE,
} from "./fastCube";
import type { CrossColor, SolverResult } from "./solverRuntime";

/** Khung tráo WCA (trắng U, xanh lá F) so với khung studio. */
const WCA_SCRAMBLE_FRAME = "z2";

/**
 * Phép xoay toàn khối đưa mặt màu cross về D (khung studio). Cross vàng dùng
 * `z2` để xanh lá vẫn ở trước — đúng hướng đang cầm sau khi tráo.
 */
export const CROSS_TO_D_ROTATION: Record<CrossColor, string> = {
  U: "z2",
  R: "z",
  F: "x'",
  D: "",
  L: "z'",
  B: "x",
};

/** Scramble WCA viết lại trong khung studio (tâm giữ nguyên vị trí). */
export function studioScrambleAlg(scramble: string): string {
  const moves = scramble.trim();
  return moves ? `${WCA_SCRAMBLE_FRAME} ${moves} ${WCA_SCRAMBLE_FRAME}` : "";
}

/** Trạng thái 54 ô (tâm ở vị trí gốc) của khối sau khi tráo theo chuẩn WCA. */
export function scrambledState(scramble: string): string {
  return applyFastMoves(SOLVED_FAST_STATE, studioScrambleAlg(scramble));
}

/** Trạng thái để hiển thị: lật khối cho màu cross nằm ở D. */
export function orientForCross(state: string, crossColor: CrossColor): string {
  const rotation = CROSS_TO_D_ROTATION[crossColor];
  return rotation ? applyFastMoves(state, rotation) : state;
}

/** Thuật toán setup cho Cubing.js: tráo như WCA rồi lật màu cross về D. */
export function previewSetupAlg(
  scramble: string,
  crossColor: CrossColor
): string {
  return [studioScrambleAlg(scramble), CROSS_TO_D_ROTATION[crossColor]]
    .filter(Boolean)
    .join(" ");
}

/**
 * Đổi chữ cái của một trạng thái tính theo khung WCA (U = mặt trên = trắng)
 * sang màu của studio, để vẽ khối đúng màu khi cầm trắng U, xanh lá F (BLD).
 */
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

// ---------------------------------------------------------------------------
// Ký hiệu lời giải theo hướng đang cầm.
// ---------------------------------------------------------------------------

/** Trạng thái 54 nhãn khác nhau: so sánh tác dụng của hai chuỗi lượt. */
const LABELED_STATE = Array.from({ length: 54 }, (_, index) =>
  String.fromCharCode(0x4e00 + index)
).join("");
const effect = (alg: string) => applyFastMoves(LABELED_STATE, alg);

const ROTATION_CANDIDATES = (() => {
  const single = ["x", "x'", "x2", "y", "y'", "y2", "z", "z'", "z2"];
  return ["", ...single, ...single.flatMap(a => single.map(b => `${a} ${b}`))];
})();

/** Phép xoay ngắn nhất `P` sao cho `from P` có cùng tác dụng với `to`. */
export function rotationBetween(from: string, to: string): string {
  const target = effect(to);
  const found = ROTATION_CANDIDATES.find(
    candidate => effect(`${from} ${candidate}`) === target
  );
  if (found === undefined)
    throw new Error(`No rotation from "${from}" to "${to}"`);
  return found;
}

/**
 * Phép xoay ghi ở đầu lời giải: từ hướng đang cầm (sau khi tráo WCA là trắng U,
 * xanh lá F; khi nhập trạng thái là hướng của lưới đã tô) sang hướng màu
 * cross ở D. Chuỗi rỗng nghĩa là không cần xoay.
 */
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

/**
 * Viết lại một lượt (khung studio) theo hướng đang cầm, tức màu cross ở D.
 * Tìm lượt `T'` có `R T' R⁻¹` cùng tác dụng với `T`, nên đúng cho cả lượt
 * mặt, wide, slice lẫn phép xoay.
 */
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
  // Giữ cách viết wide gốc ("Rw" thay vì "r").
  const written =
    match === undefined
      ? move
      : /^[URFDLB]w/.test(move) && /^[urfdlb]/.test(match)
        ? match[0].toUpperCase() + "w" + match.slice(1)
        : match;
  table.set(move, written);
  return written;
}

/** Viết lại cả một chuỗi lượt theo hướng đang cầm. */
export function heldAlgorithm(alg: string, crossColor: CrossColor): string {
  return alg
    .split(/\s+/)
    .filter(Boolean)
    .map(move => heldMove(move, crossColor))
    .join(" ");
}

/**
 * Bản sao của kết quả bộ giải với mọi lượt viết theo hướng đang cầm, để hiển
 * thị và sao chép. Trạng thái (`state`) giữ nguyên khung studio.
 */
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
