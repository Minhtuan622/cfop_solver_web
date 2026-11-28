import { describe, expect, it } from "vitest";
import { SQ1_SOLVED, applyTokens, parseSquareOneAlg } from "@/lib/squareOneModel";
import {
  SQ1_SLICE_ANGLE,
  cornerOutline,
  edgeOutline,
  faceLetterAt,
  middleHalfOutline,
  pieceAngle,
  pieceSpecs,
  placementsOf,
  planPoint,
  middleWalls,
  slotAngle,
} from "./squareOneGeometry";

describe("square-one plan geometry", () => {
  it("places the solved pieces on the axes and diagonals of one cube", () => {
    const placements = placementsOf(SQ1_SOLVED);
    expect(placements).toHaveLength(16);
    const angles = (layer: 0 | 1, width: number) =>
      placements
        .filter(piece => piece.layer === layer)
        .filter(piece => (width === 1) === (piece.id % 3 === (layer === 0 ? 2 : 0)))
        .map(piece => ((Math.round(piece.angle) % 360) + 360) % 360)
        .sort((a, b) => a - b);
    expect(angles(0, 1)).toEqual([0, 90, 180, 270]);
    expect(angles(1, 1)).toEqual([0, 90, 180, 270]);
    expect(angles(0, 2)).toEqual([45, 135, 225, 315]);
    expect(angles(1, 2)).toEqual([45, 135, 225, 315]);
  });

  it("keeps every piece inside the cube when the layers are aligned", () => {
    for (const outline of [edgeOutline(), cornerOutline()]) {
      for (const point of outline.points) {
        expect(Math.abs(point.x)).toBeLessThanOrEqual(Math.SQRT2 + 1e-9);
        expect(Math.abs(point.z)).toBeLessThanOrEqual(Math.SQRT2 + 1e-9);
      }
    }
    expect(cornerOutline().points[2].z).toBeCloseTo(-Math.SQRT2);
  });

  it("gives each piece the side colours of the faces it sits against", () => {
    const specs = pieceSpecs();
    expect(specs).toHaveLength(16);
    expect(new Set(specs.map(spec => spec.id)).size).toBe(16);
    const topEdge = specs.find(spec => spec.id === 2)!;
    expect(topEdge.low).toBe(topEdge.high);
    const topCorner = specs.find(spec => spec.id === 0)!;
    expect(topCorner.low).not.toBe(topCorner.high);
    expect(faceLetterAt(0)).toBe("B");
    expect(faceLetterAt(90)).toBe("R");
    expect(faceLetterAt(180)).toBe("F");
    expect(faceLetterAt(270)).toBe("L");
  });

  it("moves pieces to the other layer, turned over, after a slice", () => {
    const state = applyTokens(SQ1_SOLVED, parseSquareOneAlg("(0,2)/"));
    const flipped = placementsOf(state).filter(piece => piece.flipped);
    expect(flipped.map(piece => piece.layer)).toEqual(Array(flipped.length).fill(1));
    const moved = placementsOf(state).filter(piece => (piece.id < 12 ? 1 : 0) === piece.layer);
    expect(moved.length).toBeGreaterThan(0);
  });

  it("lines the bottom layer up with the top one across the slice", () => {
    // Slots 6-11 of the top and 0-5 of the bottom are the swapped half; their
    // angles mirror each other across the axis of the slice.
    for (let slot = 0; slot < 6; slot += 1) {
      const top = slotAngle(0, 6 + slot);
      const bottom = slotAngle(1, slot);
      const mirrored = 2 * SQ1_SLICE_ANGLE - top;
      expect(((bottom - mirrored) % 360 + 360) % 360).toBeCloseTo(0);
    }
  });

  it("puts a coloured wall on every outside side of the middle halves", () => {
    for (const angle of [SQ1_SLICE_ANGLE, SQ1_SLICE_ANGLE + 180]) {
      const walls = middleWalls(middleHalfOutline(angle));
      expect(walls.length).toBeGreaterThanOrEqual(3);
      expect(new Set(walls.map(wall => wall.color)).size).toBe(walls.length);
    }
  });

  it("cuts the middle layer into two halves", () => {
    const half = middleHalfOutline(SQ1_SLICE_ANGLE);
    expect(half.length).toBeGreaterThanOrEqual(4);
    const other = middleHalfOutline(SQ1_SLICE_ANGLE + 180);
    const area = (points: { x: number; z: number }[]) =>
      Math.abs(points.reduce((sum, point, index) => {
        const next = points[(index + 1) % points.length];
        return sum + point.x * next.z - next.x * point.z;
      }, 0)) / 2;
    expect(area(half) + area(other)).toBeCloseTo(4);
    expect(planPoint(0, 1).z).toBeCloseTo(-1);
    expect(pieceAngle(0, 0, 2)).toBeCloseTo(-45);
  });
});
