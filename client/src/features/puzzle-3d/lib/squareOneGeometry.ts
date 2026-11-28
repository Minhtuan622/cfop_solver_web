import { SQ1_SOLVED, SQ1_LAYER, wedgeKind } from "@/lib/squareOneModel";

// Plan view of a Square-1. Angles are in degrees and grow clockwise seen from
// above; 0 points to the back (-z), 90 to the right (+x). Layers are slabs of
// the cube shape: a corner is a 60 degree kite, an edge a 30 degree triangle.

export const SQ1_HALF_WIDTH = 1;
export const SQ1_LAYER_HEIGHT = 0.78;
export const SQ1_MIDDLE_HEIGHT = 0.42;
export const SQ1_SLOT_DEGREES = 30;
// The slice flips the half of the puzzle that holds the top slots 6-11.
export const SQ1_SLICE_ANGLE = 195;

// The usual Square-1 scheme: black on top, white underneath and one colour on
// each of the four sides.
export const SQ1_PALETTE = {
  U: "#161616",
  D: "#f0f0f0",
  L: "#1f4dff",
  B: "#ff8000",
  R: "#00b53d",
  F: "#d0021b",
  BODY: "#2a2a30",
} as const;

export type PlanPoint = { x: number; z: number };

const rad = (degrees: number) => (degrees * Math.PI) / 180;

export function planPoint(angle: number, radius: number): PlanPoint {
  return { x: Math.sin(rad(angle)) * radius, z: -Math.cos(rad(angle)) * radius };
}

// Angle of the centre of a slot: the top layer reads clockwise from -60 and
// the bottom layer counter-clockwise from -90, so both lay out as one cube.
export function slotAngle(layer: 0 | 1, slot: number) {
  return layer === 0 ? -60 + SQ1_SLOT_DEGREES * slot : -90 - SQ1_SLOT_DEGREES * slot;
}

export function pieceAngle(layer: 0 | 1, start: number, width: number) {
  return slotAngle(layer, start + (width - 1) / 2);
}

const SIDE_FACE_LETTERS = ["B", "R", "F", "L"] as const;

export function faceLetterAt(angle: number) {
  const index = ((Math.round(angle / 90) % 4) + 4) % 4;
  return SIDE_FACE_LETTERS[index];
}

// Plan outlines of a piece sitting at angle 0, listed clockwise. `outer` marks
// the edges that are part of the outside of the cube.
export type PieceOutline = { points: PlanPoint[]; outer: boolean[] };

const EDGE_OUTLINE_RADIUS = SQ1_HALF_WIDTH / Math.cos(rad(15));

export function edgeOutline(): PieceOutline {
  return {
    points: [{ x: 0, z: 0 }, planPoint(-15, EDGE_OUTLINE_RADIUS), planPoint(15, EDGE_OUTLINE_RADIUS)],
    outer: [false, true, false],
  };
}

export function cornerOutline(): PieceOutline {
  return {
    points: [
      { x: 0, z: 0 },
      planPoint(-30, EDGE_OUTLINE_RADIUS),
      planPoint(0, SQ1_HALF_WIDTH * Math.SQRT2),
      planPoint(30, EDGE_OUTLINE_RADIUS),
    ],
    outer: [false, true, true, false],
  };
}

export type PieceSpec = {
  id: number; // wedge the piece starts on in the solved state
  kind: "edge" | "corner";
  home: 0 | 1;
  cap: string;
  low: string; // colour of the outer face on the lower-angle side
  high: string;
  width: 1 | 2;
};

// The sixteen pieces with their colours. A piece keeps its colours for good;
// only its place and whether it is turned over change.
export function pieceSpecs(): PieceSpec[] {
  const specs: PieceSpec[] = [];
  for (const layer of [0, 1] as const) {
    for (let slot = 0; slot < SQ1_LAYER; slot += 1) {
      const id = layer * SQ1_LAYER + slot;
      const kind = wedgeKind(SQ1_SOLVED[id]);
      if (kind === 1) continue;
      const width = kind === 2 ? 1 : 2;
      const angle = pieceAngle(layer, slot, width);
      const cap = SQ1_PALETTE[layer === 0 ? "U" : "D"];
      const lowSide = SQ1_PALETTE[faceLetterAt(width === 1 ? angle : angle - 45)];
      const highSide = SQ1_PALETTE[faceLetterAt(width === 1 ? angle : angle + 45)];
      // The bottom layer is built flipped over, which swaps the two sides.
      specs.push({
        id,
        kind: kind === 2 ? "edge" : "corner",
        home: layer,
        cap,
        low: layer === 0 ? lowSide : highSide,
        high: layer === 0 ? highSide : lowSide,
        width,
      });
    }
  }
  return specs;
}

export type PiecePlacement = {
  id: number;
  layer: 0 | 1;
  start: number;
  angle: number;
  flipped: boolean;
};

// Where every piece sits for a state: the wedge in the first slot of a piece
// names it.
export function placementsOf(state: readonly number[]): PiecePlacement[] {
  const placements: PiecePlacement[] = [];
  for (const layer of [0, 1] as const) {
    for (let slot = 0; slot < SQ1_LAYER; slot += 1) {
      const wedge = state[layer * SQ1_LAYER + slot];
      const kind = wedgeKind(wedge);
      if (kind === 1) continue;
      placements.push({
        id: wedge,
        layer,
        start: slot,
        angle: pieceAngle(layer, slot, kind === 2 ? 1 : 2),
        flipped: layer === 1,
      });
    }
  }
  return placements;
}

// Clips the square footprint of the middle layer by the half-plane that faces
// `angle`. The two clipped halves are the two pieces of the middle layer.
export function middleHalfOutline(angle: number): PlanPoint[] {
  const normal = planPoint(angle, 1);
  const side = (point: PlanPoint) => point.x * normal.x + point.z * normal.z;
  const square: PlanPoint[] = [
    { x: -1, z: -1 },
    { x: 1, z: -1 },
    { x: 1, z: 1 },
    { x: -1, z: 1 },
  ];
  const clipped: PlanPoint[] = [];
  square.forEach((point, index) => {
    const next = square[(index + 1) % square.length];
    const here = side(point);
    const there = side(next);
    if (here >= 0) clipped.push(point);
    if ((here >= 0) !== (there >= 0)) {
      const t = here / (here - there);
      clipped.push({ x: point.x + (next.x - point.x) * t, z: point.z + (next.z - point.z) * t });
    }
  });
  return clipped;
}

// The sides of a middle-layer half that lie on the outside of the cube, each
// with the face colour it carries.
export function middleWalls(outline: readonly PlanPoint[]) {
  const walls: { from: PlanPoint; to: PlanPoint; color: string }[] = [];
  outline.forEach((from, index) => {
    const to = outline[(index + 1) % outline.length];
    const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
    let color: string | null = null;
    if (near(from.x, 1) && near(to.x, 1)) color = SQ1_PALETTE.R;
    else if (near(from.x, -1) && near(to.x, -1)) color = SQ1_PALETTE.L;
    else if (near(from.z, 1) && near(to.z, 1)) color = SQ1_PALETTE.F;
    else if (near(from.z, -1) && near(to.z, -1)) color = SQ1_PALETTE.B;
    if (color) walls.push({ from, to, color });
  });
  return walls;
}
