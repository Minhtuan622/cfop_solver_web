import { TAU } from "./sideEventShared";

export const SQUARE_EDGE_SIDE = "R-B-L-F-F-L-B-R-";
export const SQUARE_CORNER_SIDE = "RBBLLFFRRFFLLBBR";
export const SQUARE1_SOLVED_WEDGES = [0, 1, 1, 2, 3, 3, 4, 5, 5, 6, 7, 7, 9, 9, 8, 11, 11, 10, 13, 13, 12, 12, 15, 14];

export type SquareOneState = { wedges: number[]; middle: 0 | 1 };
export type SquareOneVisualSlot = { position: number; piece: number; units: 1 | 2; kind: "edge" | "corner"; face: "U" | "D" };

export function squareOneWedgeUnits(piece: number) { return piece % 2 === 1 ? 2 : 1; }
export function squareOnePieceKind(piece: number) { return piece % 2 === 1 ? "corner" : "edge"; }

export function squareOneVisualSlots(pieces: number[], startIndex: number): SquareOneVisualSlot[] {
  const slots: SquareOneVisualSlot[] = [];
  for (let position = 0; position < 12; position += 1) {
    const piece = pieces[startIndex + position] ?? startIndex + position;
    const units = squareOneWedgeUnits(piece) as 1 | 2;
    slots.push({ position, piece, units, kind: squareOnePieceKind(piece), face: piece >= 8 ? "D" : "U" });
    if (units === 2) position += 1;
  }
  return slots;
}

function rotateSquareLayer(wedges: number[], start: number, amount: number) {
  const source = wedges.slice(start, start + 12);
  const offset = ((amount % 12) + 12) % 12;
  for (let index = 0; index < 12; index += 1) wedges[start + index] = source[(index + offset) % 12] ?? source[index]!;
}

export function squareOneStateFromScramble(scramble: string): SquareOneState {
  const state: SquareOneState = { wedges: [...SQUARE1_SOLVED_WEDGES], middle: 0 };
  const tokens = scramble.match(/\(\s*-?\d+\s*,\s*-?\d+\s*\)|\//g) ?? [];
  for (const token of tokens) {
    if (token === "/") {
      const upperRight = state.wedges.slice(6, 12);
      state.wedges.splice(6, 6, ...state.wedges.slice(12, 18));
      state.wedges.splice(12, 6, ...upperRight);
      state.middle = state.middle === 0 ? 1 : 0;
      continue;
    }
    const match = token.match(/\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/);
    if (!match) continue;
    rotateSquareLayer(state.wedges, 0, Number(match[1]));
    rotateSquareLayer(state.wedges, 12, Number(match[2]));
  }
  return state;
}

export function squareTurnForAnimation(move: string) {
  const match = move.match(/^(U|D)_SQ_(\d*)('?)/);
  if (!match) return null;
  const amount = (match[2] ? Number(match[2]) : 1) * (match[3] ? -1 : 1);
  return { layer: match[1] === "U" ? "top" : "bottom", angle: amount * (TAU / 12) } as const;
}

export function squareSlashPose(progress: number) {
  const phase = Math.max(0, Math.min(1, progress));
  const lift = Math.sin(Math.PI * phase) * 0.34;
  return { topY: lift, bottomY: lift === 0 ? 0 : -lift, topAngle: Math.PI * phase, bottomAngle: phase === 0 ? 0 : -Math.PI * phase, beltScaleY: 1 + lift * 1.6 };
}
