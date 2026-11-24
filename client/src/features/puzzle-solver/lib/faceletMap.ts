import {
  CORNER_SLOTS,
  EDGE_SLOTS,
} from "@/features/timer/lib/kpatternFacelets";
import { SOLVED_STATE } from "@/components/common/CubeNet";
import type { Painting, StateModel, StateSticker } from "./puzzleState";

const FACE_ORDER = "URFDLB";

export function faceletIndex(sticker: Pick<StateSticker, "orbit" | "slot" | "face">) {
  if (sticker.orbit === "CENTERS") return 9 * FACE_ORDER.indexOf(sticker.face) + 4;
  const row = sticker.orbit === "CORNERS" ? CORNER_SLOTS[sticker.slot] : EDGE_SLOTS[sticker.slot];
  return row.find(index => FACE_ORDER[Math.floor(index / 9)] === sticker.face) ?? row[0];
}

export function faceletsToPainting(model: StateModel, state: string): Painting {
  const source = state.length === 54 ? state : SOLVED_STATE;
  return Object.fromEntries(
    model.stickers.map(sticker => [sticker.id, source[faceletIndex(sticker)]])
  );
}

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
