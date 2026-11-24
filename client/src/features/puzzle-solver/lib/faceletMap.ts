/**
 * Cầu nối giữa trạng thái 3×3 của trang Giải (chuỗi 54 ký tự, thứ tự URFDLB) và
 * màu từng sticker của bộ tô màu chung (`puzzleState`). Mỗi sticker `ORBIT-l-o`
 * ứng đúng một chỉ số trong chuỗi, nên không cần dựng pattern: hai chiều chỉ là
 * tra bảng và luôn đảo ngược được, kể cả khi trạng thái chưa hợp lệ.
 */
import {
  CORNER_SLOTS,
  EDGE_SLOTS,
} from "@/features/timer/lib/kpatternFacelets";
import { SOLVED_STATE } from "@/components/common/CubeNet";
import type { Painting, StateModel, StateSticker } from "./puzzleState";

const FACE_ORDER = "URFDLB";

/**
 * Chỉ số trong chuỗi 54 ký tự của một sticker 3×3. Tìm theo MẶT của sticker
 * (thứ tự sticker trong mảnh của cubing.js khác thứ tự trong bảng facelet).
 */
export function faceletIndex(sticker: Pick<StateSticker, "orbit" | "slot" | "face">) {
  if (sticker.orbit === "CENTERS") return 9 * FACE_ORDER.indexOf(sticker.face) + 4;
  const row = sticker.orbit === "CORNERS" ? CORNER_SLOTS[sticker.slot] : EDGE_SLOTS[sticker.slot];
  return row.find(index => FACE_ORDER[Math.floor(index / 9)] === sticker.face) ?? row[0];
}

/** Chuỗi trạng thái → màu từng sticker (chuỗi sai độ dài thì coi như khối đã giải). */
export function faceletsToPainting(model: StateModel, state: string): Painting {
  const source = state.length === 54 ? state : SOLVED_STATE;
  return Object.fromEntries(
    model.stickers.map(sticker => [sticker.id, source[faceletIndex(sticker)]])
  );
}

/** Màu từng sticker → chuỗi trạng thái. Ô tâm chia 4 tam giác lấy tam giác đầu. */
export function paintingToFacelets(
  model: StateModel,
  painting: Painting,
  base: string
): string {
  const next = (base.length === 54 ? base : SOLVED_STATE).split("");
  for (const sticker of model.stickers) {
    if (sticker.orbit === "CENTERS" && sticker.k !== 0) continue;
    const face = painting[sticker.id];
    if (face) next[faceletIndex(sticker)] = face;
  }
  return next.join("");
}
