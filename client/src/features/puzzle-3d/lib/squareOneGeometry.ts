import { SQ1_SOLVED, SQ1_LAYER, wedgeKind } from "@/lib/squareOneModel";
import { CUBE_COLORS } from "./cubeColors";

// Plan view of a Square-1. Angles are in degrees and grow clockwise seen from
// above; 0 points to the back (-z), 90 to the right (+x). Layers are slabs of
// the cube shape: a corner is a 60 degree kite, an edge a 30 degree triangle.

export const SQ1_HALF_WIDTH = 1;
export const SQ1_LAYER_HEIGHT = 0.78;
export const SQ1_MIDDLE_HEIGHT = 0.42;
export const SQ1_SLOT_DEGREES = 30;
// The slice flips the half of the puzzle that holds the top slots 6-11.
export const SQ1_SLICE_ANGLE = 195;

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
      const cap = CUBE_COLORS[layer === 0 ? "U" : "D"];
      const lowSide = CUBE_COLORS[faceLetterAt(width === 1 ? angle : angle - 45)];
      const highSide = CUBE_COLORS[faceLetterAt(width === 1 ? angle : angle + 45)];
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

export type MeshArrays = { positions: number[]; colors: number[] };

const hexToRgb = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
};

export const SQ1_BODY_COLOR = "#1b1b1f";

// A prism over a convex outline from y0 up to y1, triangle by triangle with a
// colour per face: cap on top, `faceColors[i]` on the side that starts at point
// i, and the body colour everywhere else.
export function prismArrays(
  points: readonly PlanPoint[],
  y0: number,
  y1: number,
  capColor: string,
  faceColors: readonly (string | null)[]
): MeshArrays {
  const positions: number[] = [];
  const colors: number[] = [];
  const body = hexToRgb(SQ1_BODY_COLOR);
  const push = (color: [number, number, number], ...vertices: [number, number, number][]) => {
    for (const [x, y, z] of vertices) {
      positions.push(x, y, z);
      colors.push(...color);
    }
  };
  const cap = hexToRgb(capColor);
  for (let index = 1; index < points.length - 1; index += 1) {
    const a = points[0];
    const b = points[index];
    const c = points[index + 1];
    // Seen from above the outline runs clockwise, so this winding faces up.
    push(cap, [a.x, y1, a.z], [c.x, y1, c.z], [b.x, y1, b.z]);
    push(body, [a.x, y0, a.z], [b.x, y0, b.z], [c.x, y0, c.z]);
  }
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    const color = faceColors[index] ? hexToRgb(faceColors[index] as string) : body;
    // The outline runs clockwise from above, so this winding faces outwards.
    push(
      color,
      [point.x, y0, point.z],
      [next.x, y1, next.z],
      [next.x, y0, next.z],
      [point.x, y0, point.z],
      [point.x, y1, point.z],
      [next.x, y1, next.z]
    );
  });
  return { positions, colors };
}
