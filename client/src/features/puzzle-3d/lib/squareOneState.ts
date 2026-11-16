import { TAU, type PatternData } from "./sideEventShared";

/**
 * Square-1 wedge model, keyed by the Cubing.js KPuzzle piece indices.
 *
 * The WEDGES orbit holds 24 wedge halves over 12 slots per layer. Solved,
 * piece p sits in slot p: the top ring (slots 0-11) starts with a corner,
 * the bottom ring (12-23) starts with an edge — the phase offset that makes
 * the puzzle shape-shift. A corner is two adjacent wedge halves and they
 * only ever separate across the slice cut, which legal scrambles never do,
 * so rendering can walk each layer and pair halves greedily.
 */

export type SquareOnePieceKind = "edge" | "cornerFirst" | "cornerSecond";
export type SquareOneFace = "U" | "D";

export function squareOnePieceKind(piece: number): SquareOnePieceKind {
  if (piece < 12)
    return piece % 3 === 2
      ? "edge"
      : piece % 3 === 0
        ? "cornerFirst"
        : "cornerSecond";
  return piece % 3 === 0
    ? "edge"
    : piece % 3 === 1
      ? "cornerFirst"
      : "cornerSecond";
}

export function squareOnePieceFace(piece: number): SquareOneFace {
  return piece < 12 ? "U" : "D";
}

/** Side-sticker face letter of one wedge half, read off the solved cube. */
export function squareOnePieceSide(piece: number): string {
  const cycle = piece < 12 ? ["R", "B", "L", "F"] : ["R", "F", "L", "B"];
  const step = piece < 12 ? Math.floor(piece / 3) : Math.floor(piece / 3) - 4;
  const offset =
    piece < 12 ? (piece % 3 === 0 ? 0 : 1) : piece % 3 === 2 ? 1 : 0;
  return cycle[(step + offset) % 4]!;
}

export type SquareOneState = { pieces: number[]; middle: 0 | 1 };

export type SquareOneLayerPiece = {
  first: number;
  second: number | null;
  firstSlot: number;
  secondSlot: number | null;
};

/**
 * Walk a 12-slot ring the same way the renderer pairs halves: edges are
 * single pieces, corner halves pair greedily, and a cornerSecond leading the
 * walk pairs across the seam with the cornerFirst sitting in the last slot
 * of the same layer.
 */
export function squareOneLayerPieces(
  pieces: number[],
  layerStart: 0 | 12
): SquareOneLayerPiece[] {
  const list: SquareOneLayerPiece[] = [];
  let position = 0;
  while (position < 12) {
    const slot = layerStart + position;
    const kind = squareOnePieceKind(pieces[slot] ?? slot);
    if (kind === "edge") {
      list.push({
        first: pieces[slot] ?? slot,
        second: null,
        firstSlot: slot,
        secondSlot: null,
      });
      position += 1;
    } else if (kind === "cornerSecond") {
      const firstSlot = layerStart + 11;
      list.push({
        first: pieces[firstSlot] ?? firstSlot,
        second: pieces[slot] ?? slot,
        firstSlot,
        secondSlot: slot,
      });
      position += 1;
    } else if (position === 11) {
      // Corner first half at the seam was rendered with the leading second half.
      position += 1;
    } else {
      list.push({
        first: pieces[slot] ?? slot,
        second: pieces[slot + 1] ?? slot + 1,
        firstSlot: slot,
        secondSlot: slot + 1,
      });
      position += 2;
    }
  }
  return list;
}

/** Read the render state straight from the KPuzzle pattern (ground truth). */
export function squareOneStateFromPattern(
  pattern: PatternData
): SquareOneState {
  const wedges = pattern.WEDGES;
  if (!wedges) throw new Error("Square-1 pattern is unavailable");
  const equator = pattern.EQUATOR;
  const middle = equator
    ? ((Math.round((equator.orientation[0] ?? 0) / 3) % 2) + 2) % 2
    : 0;
  return { pieces: [...wedges.pieces], middle: middle as 0 | 1 };
}

/**
 * World angle of a wedge slot, measured from +z (front) toward +x (right).
 * The two rings run in opposite directions: top slot 8 and bottom slot 15
 * are the front-face edge wedges of the solved cube.
 */
export function squareOneSlotAngle(slot: number): number {
  return (slot < 12 ? slot - 8 : 15 - slot) * (TAU / 12);
}

export type SquareTurnStep = { top: number; bottom: number };

/** Layer rotation (radians) one animation step performs, for either notation. */
export function squareTurnForAnimation(move: string): SquareTurnStep | null {
  const unit = TAU / 12;
  const pair = move.match(/\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/);
  if (pair)
    return { top: Number(pair[1]) * unit, bottom: Number(pair[2]) * unit };
  const turn = move.match(/^(U|D)_SQ_(\d*)('?)$/);
  if (!turn) return null;
  const angle = (turn[2] ? Number(turn[2]) : 1) * (turn[3] ? -1 : 1) * unit;
  return turn[1] === "U"
    ? { top: angle, bottom: 0 }
    : { top: 0, bottom: angle };
}

export function squareSlashPose(progress: number) {
  const phase = Math.max(0, Math.min(1, progress));
  const lift = Math.sin(Math.PI * phase) * 0.34;
  return {
    topY: lift,
    bottomY: lift === 0 ? 0 : -lift,
    topAngle: Math.PI * phase,
    bottomAngle: phase === 0 ? 0 : -Math.PI * phase,
    beltScaleY: 1 + lift * 1.6,
  };
}
