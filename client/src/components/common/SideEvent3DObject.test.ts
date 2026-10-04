import { describe, expect, it } from "vitest";
import { clockDialIndex, isSideEvent3DPuzzle, squareOnePieceKind, squareOneStateFromScramble, squareOneVisualSlots, squareOneWedgeUnits, squareSlashPose, squareTurnForAnimation } from "./SideEvent3DObject";

describe("side-event 3D renderer selection", () => {
  it("uses the custom Three.js state renderer only for Square-1 and Clock", () => {
    expect(isSideEvent3DPuzzle("square1")).toBe(true);
    expect(isSideEvent3DPuzzle("clock")).toBe(true);
    expect(isSideEvent3DPuzzle("skewb")).toBe(false);
    expect(isSideEvent3DPuzzle("megaminx")).toBe(false);
  });

  it("maps Square-1 upper and lower layer moves to deterministic turn directions", () => {
    expect(squareTurnForAnimation("U_SQ_3")).toMatchObject({ layer: "top", angle: Math.PI / 2 });
    expect(squareTurnForAnimation("D_SQ_2'")).toMatchObject({ layer: "bottom", angle: -Math.PI / 3 });
    expect(squareTurnForAnimation("/")).toBeNull();
  });

  it("keeps Square-1 edge/corner pairing and Clock column order deterministic", () => {
    expect(squareOneWedgeUnits(0)).toBe(1);
    expect(squareOneWedgeUnits(15)).toBe(2);
    expect(squareOnePieceKind(0)).toBe("edge");
    expect(squareOnePieceKind(15)).toBe("corner");
    expect(clockDialIndex(0, 0)).toBe(0);
    expect(clockDialIndex(2, 1)).toBe(5);
    expect(clockDialIndex(0, 0, true)).toBe(2);
  });

  it("recreates the csTimer wedge state for a shape-shift scramble", () => {
    const state = squareOneStateFromScramble("(1, 0) / (3, -3) / (-1, 0)");
    expect(state.middle).toBe(0);
    expect(state.wedges).toEqual([6, 3, 3, 4, 9, 9, 8, 12, 15, 14, 5, 5, 11, 11, 10, 1, 1, 2, 7, 7, 0, 13, 13, 12]);
    expect(squareOneVisualSlots(state.wedges, 0).slice(0, 3)).toMatchObject([
      { position: 0, piece: 6, kind: "edge", face: "U" },
      { position: 1, piece: 3, kind: "corner", face: "U" },
      { position: 3, piece: 4, kind: "edge", face: "U" },
    ]);
  });

  it("separates and counter-rotates Square-1 layers during a slash", () => {
    expect(squareSlashPose(0)).toMatchObject({ topY: 0, bottomY: 0, topAngle: 0, bottomAngle: 0 });
    const middle = squareSlashPose(0.5);
    expect(middle.topY).toBeGreaterThan(0.3);
    expect(middle.bottomY).toBeLessThan(-0.3);
    expect(middle.topAngle).toBeCloseTo(Math.PI / 2);
    expect(middle.bottomAngle).toBeCloseTo(-Math.PI / 2);
    expect(squareSlashPose(1).topAngle).toBeCloseTo(Math.PI);
  });
});
