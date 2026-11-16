import { describe, expect, it } from "vitest";
import { isSideEvent3DPuzzle } from "./puzzleIds";
import { clockDialIndex } from "./clockGeometry";
import {
  squareOneLayerPieces,
  squareOnePieceFace,
  squareOnePieceKind,
  squareOnePieceSide,
  squareOneSlotAngle,
  squareOneStateFromPattern,
  squareSlashPose,
  squareTurnForAnimation,
} from "./squareOneState";
import type { PatternData } from "./sideEventShared";

describe("side-event 3D renderer selection", () => {
  it("uses the custom Three.js state renderer only for Square-1 and Clock", () => {
    expect(isSideEvent3DPuzzle("square1")).toBe(true);
    expect(isSideEvent3DPuzzle("clock")).toBe(true);
    expect(isSideEvent3DPuzzle("skewb")).toBe(false);
    expect(isSideEvent3DPuzzle("megaminx")).toBe(false);
  });
});

describe("Square-1 KPuzzle wedge model", () => {
  // Piece table read off the solved cube: kind, face and side sticker letter.
  const table: Array<[number, string, string, string]> = [
    [0, "cornerFirst", "U", "R"],
    [1, "cornerSecond", "U", "B"],
    [2, "edge", "U", "B"],
    [3, "cornerFirst", "U", "B"],
    [4, "cornerSecond", "U", "L"],
    [5, "edge", "U", "L"],
    [6, "cornerFirst", "U", "L"],
    [7, "cornerSecond", "U", "F"],
    [8, "edge", "U", "F"],
    [9, "cornerFirst", "U", "F"],
    [10, "cornerSecond", "U", "R"],
    [11, "edge", "U", "R"],
    [12, "edge", "D", "R"],
    [13, "cornerFirst", "D", "R"],
    [14, "cornerSecond", "D", "F"],
    [15, "edge", "D", "F"],
    [16, "cornerFirst", "D", "F"],
    [17, "cornerSecond", "D", "L"],
    [18, "edge", "D", "L"],
    [19, "cornerFirst", "D", "L"],
    [20, "cornerSecond", "D", "B"],
    [21, "edge", "D", "B"],
    [22, "cornerFirst", "D", "B"],
    [23, "cornerSecond", "D", "R"],
  ];

  it("classifies every wedge half with the solved sticker colours", () => {
    for (const [piece, kind, face, side] of table) {
      expect(squareOnePieceKind(piece), `kind of ${piece}`).toBe(kind);
      expect(squareOnePieceFace(piece), `face of ${piece}`).toBe(face);
      expect(squareOnePieceSide(piece), `side of ${piece}`).toBe(side);
    }
  });

  it("forms three-wedge cube faces around each ring", () => {
    const sides = table.map(([, , face, side]) => `${face}${side}`);
    for (const face of ["U", "D"]) {
      const ring = sides
        .filter(entry => entry.startsWith(face))
        .map(entry => entry.slice(1));
      for (const letter of ["R", "B", "L", "F"]) {
        expect(
          ring.filter(side => side === letter).length,
          `${face} ${letter} wedges`
        ).toBe(3);
      }
    }
  });

  it("points the front edge wedges of both rings at the camera", () => {
    expect(squareOneSlotAngle(8)).toBe(0);
    expect(squareOneSlotAngle(15)).toBe(0);
    expect(squareOneSlotAngle(11)).toBeCloseTo(Math.PI / 2);
    expect(squareOneSlotAngle(12)).toBeCloseTo(Math.PI / 2);
    expect(squareOneSlotAngle(2)).toBeCloseTo(-Math.PI);
    expect(squareOneSlotAngle(18)).toBeCloseTo(-Math.PI / 2);
  });

  it("reads the render state straight from the KPuzzle pattern", () => {
    const pattern: PatternData = {
      WEDGES: {
        pieces: [
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
          20, 21, 22, 23,
        ],
        orientation: Array<number>(24).fill(0),
      },
      EQUATOR: { pieces: [0, 1], orientation: [0, 0] },
    };
    expect(squareOneStateFromPattern(pattern)).toEqual({
      pieces: pattern.WEDGES!.pieces,
      middle: 0,
    });
    const slashed: PatternData = {
      WEDGES: {
        pieces: [
          0, 1, 2, 3, 4, 5, 12, 13, 14, 15, 16, 17, 6, 7, 8, 9, 10, 11, 18, 19,
          20, 21, 22, 23,
        ],
        orientation: Array<number>(24).fill(0),
      },
      EQUATOR: { pieces: [1, 0], orientation: [3, 3] },
    };
    expect(squareOneStateFromPattern(slashed)).toMatchObject({ middle: 1 });
  });

  it("maps both Square-1 notations to layer turns", () => {
    expect(squareTurnForAnimation("(1, 0)")).toEqual({
      top: Math.PI / 6,
      bottom: 0,
    });
    expect(squareTurnForAnimation("(-3, 2)")).toEqual({
      top: -Math.PI / 2,
      bottom: Math.PI / 3,
    });
    expect(squareTurnForAnimation("U_SQ_3")).toEqual({
      top: Math.PI / 2,
      bottom: 0,
    });
    expect(squareTurnForAnimation("D_SQ_2'")).toEqual({
      top: 0,
      bottom: -Math.PI / 3,
    });
    expect(squareTurnForAnimation("/")).toBeNull();
  });

  it("pairs corner halves greedily and across the layer seam", () => {
    const solved = Array.from({ length: 24 }, (_, index) => index);
    const top = squareOneLayerPieces(solved, 0);
    expect(top).toHaveLength(8);
    expect(top.filter(entry => entry.second === null)).toHaveLength(4);
    expect(top[0]).toMatchObject({
      first: 0,
      second: 1,
      firstSlot: 0,
      secondSlot: 1,
    });
    const bottom = squareOneLayerPieces(solved, 12);
    expect(bottom).toHaveLength(8);
    expect(bottom[0]).toMatchObject({ first: 12, second: null });
    // Solved cube rotated two slots: a corner strap pairs across slot 11 -> 0.
    const shiftedTop = [10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const seamPieces = [...shiftedTop, ...solved.slice(12)];
    const rendered = squareOneLayerPieces(seamPieces, 0);
    const seam = rendered.find(entry => entry.firstSlot === 11);
    expect(seam).toMatchObject({ first: 9, second: 10, secondSlot: 0 });
    expect(rendered).toHaveLength(8);
    expect(rendered.filter(entry => entry.second === null)).toHaveLength(4);
  });

  it("separates and counter-rotates Square-1 layers during a slash", () => {
    expect(squareSlashPose(0)).toMatchObject({
      topY: 0,
      bottomY: 0,
      topAngle: 0,
      bottomAngle: 0,
    });
    const middle = squareSlashPose(0.5);
    expect(middle.topY).toBeGreaterThan(0.3);
    expect(middle.bottomY).toBeLessThan(-0.3);
    expect(middle.topAngle).toBeCloseTo(Math.PI / 2);
    expect(middle.bottomAngle).toBeCloseTo(-Math.PI / 2);
    expect(squareSlashPose(1).topAngle).toBeCloseTo(Math.PI);
  });
});

describe("Clock KPuzzle dial layout", () => {
  it("keeps the front row-major and mirrors the back ring indices", () => {
    expect(clockDialIndex(0, 0)).toBe(0);
    expect(clockDialIndex(2, 1)).toBe(5);
    expect(clockDialIndex(0, 0, true)).toBe(11);
    expect(clockDialIndex(2, 0, true)).toBe(9);
    expect(clockDialIndex(1, 1, true)).toBe(13);
    expect(clockDialIndex(0, 2, true)).toBe(17);
  });
});
