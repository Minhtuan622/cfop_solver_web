/**
 * Mốc giai đoạn CFOP của một lượt giải, tính lại từ chuỗi nước đã ghi (không
 * cần cube báo lúc giải): mặt làm cross là mặt bất kỳ trong 6 mặt, F2L tách
 * thành bốn cặp, rồi OLL và PLL.
 *
 * Smart cube báo nước đi theo tâm cố định (xoay cả khối không sinh nước), nên
 * khối khung luôn là khung tâm. Với mỗi mặt X ta xoay + đổi nhãn màu để X thành
 * mặt D, rồi dùng cùng bộ kiểm tra vị trí như cross ở D.
 */
import {
  SOLVED_FAST_STATE,
  applyFastMoves,
  stateFromScramble,
} from "@/lib/fastCube";
import type { SolvePhaseSplit } from "@/lib/solveHistory";

export type CrossFace = "U" | "R" | "F" | "D" | "L" | "B";
export const CROSS_FACES: readonly CrossFace[] = ["D", "U", "F", "B", "R", "L"];

/** Phép xoay cả khối đưa mặt X về D. */
const TO_BOTTOM: Record<CrossFace, string> = {
  D: "",
  U: "x2",
  F: "x'",
  B: "x",
  R: "z",
  L: "z'",
};

const relabelCache = new Map<CrossFace, Record<string, string>>();

/** Bảng đổi nhãn: sau khi xoay, màu ở vị trí i đổi lại thành màu của mặt tại vị trí đó. */
function relabelFor(face: CrossFace) {
  let table = relabelCache.get(face);
  if (!table) {
    const rotated = rotate(SOLVED_FAST_STATE, face);
    table = {};
    for (let index = 0; index < 54; index += 1) table[rotated[index]] = SOLVED_FAST_STATE[index];
    relabelCache.set(face, table);
  }
  return table;
}

function rotate(state: string, face: CrossFace) {
  return TO_BOTTOM[face] ? applyFastMoves(state, TO_BOTTOM[face]) : state;
}

/**
 * Đưa trạng thái về khung "cross ở D": xoay mặt `face` xuống D và đổi nhãn để
 * khối đã giải vẫn là `SOLVED_FAST_STATE`.
 */
export function normalizeState(state: string, face: CrossFace) {
  if (face === "D") return state;
  const table = relabelFor(face);
  let out = "";
  for (const char of rotate(state, face)) out += table[char] ?? char;
  return out;
}

// Vị trí sticker (URFDLB) của từng mảnh trong khung "cross ở D".
const CROSS_STICKERS = [28, 25, 32, 16, 34, 52, 30, 43];
const SLOT_STICKERS = [
  [29, 15, 26, 23, 12], // DRF + FR
  [27, 24, 44, 21, 41], // DFL + FL
  [35, 51, 17, 48, 14], // DBR + BR
  [33, 42, 53, 50, 39], // DLB + BL
] as const;
const U_FACE = [0, 1, 2, 3, 4, 5, 6, 7, 8];

const matches = (state: string, indices: readonly number[]) =>
  indices.every(index => state[index] === SOLVED_FAST_STATE[index]);

export function isCrossSolved(state: string) {
  return matches(state, CROSS_STICKERS);
}
export function solvedPairCount(state: string) {
  return SLOT_STICKERS.filter(stickers => matches(state, stickers)).length;
}
export function isLastLayerOriented(state: string) {
  return U_FACE.every(index => state[index] === "U");
}

/** Mốc theo số nước đã đi (chỉ số trạng thái, 0 = chưa đi nước nào). */
export type SolveMarks = {
  face: CrossFace;
  cross: number;
  /** Số nước đã đi khi xong cặp thứ 1…4. */
  pairs: [number, number, number, number];
  oll: number;
  total: number;
};

function marksForFace(states: readonly string[], face: CrossFace): SolveMarks | null {
  const normalized = states.map(state => normalizeState(state, face));
  let cross = -1;
  const pairs: number[] = [];
  let oll = -1;
  for (let index = 0; index < normalized.length; index += 1) {
    const state = normalized[index];
    if (!isCrossSolved(state)) continue;
    if (cross < 0) cross = index;
    const count = solvedPairCount(state);
    while (pairs.length < Math.min(count, 4)) pairs.push(index);
    if (pairs.length === 4 && oll < 0 && isLastLayerOriented(state)) {
      oll = index;
      break;
    }
  }
  if (cross < 0 || pairs.length < 4 || oll < 0) return null;
  return {
    face,
    cross,
    pairs: pairs as SolveMarks["pairs"],
    oll,
    total: states.length - 1,
  };
}

/**
 * Tính mốc cho mọi mặt rồi chọn mặt có F2L xong sớm nhất (mặt đối diện cross
 * chỉ "xong F2L" khi gần như cả khối đã giải). Trả `null` nếu không giải theo
 * kiểu CFOP trên mặt nào.
 */
export function deriveMarks(scramble: string, moves: readonly string[]): SolveMarks | null {
  if (!moves.length) return null;
  let states: string[];
  try {
    const initial = stateFromScramble(scramble);
    states = [initial];
    let current = initial;
    for (const move of moves) {
      current = applyFastMoves(current, move);
      states.push(current);
    }
  } catch {
    return null;
  }
  let best: SolveMarks | null = null;
  for (const face of CROSS_FACES) {
    const marks = marksForFace(states, face);
    if (!marks) continue;
    if (
      !best ||
      marks.pairs[3] < best.pairs[3] ||
      (marks.pairs[3] === best.pairs[3] && marks.cross < best.cross)
    )
      best = marks;
  }
  return best;
}

/** Bốn mốc Cross / F2L / OLL / PLL để lưu cùng lượt giải (cùng định dạng smart cube lúc giải). */
export function marksToSplits(marks: SolveMarks, moveTimes: readonly number[]): SolvePhaseSplit[] {
  const at = (count: number) => (count <= 0 ? 0 : (moveTimes[count - 1] ?? 0));
  const cross = at(marks.cross);
  const f2l = at(marks.pairs[3]);
  const oll = at(marks.oll);
  const end = at(marks.total);
  return [
    { phase: "Cross", markedAtMs: cross, elapsedMs: cross },
    { phase: "F2L", markedAtMs: f2l, elapsedMs: f2l - cross },
    { phase: "OLL", markedAtMs: oll, elapsedMs: oll - f2l },
    { phase: "PLL", markedAtMs: end, elapsedMs: end - oll },
  ];
}
