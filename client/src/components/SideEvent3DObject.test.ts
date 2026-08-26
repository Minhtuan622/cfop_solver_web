import { describe, expect, it } from "vitest";
import { clockDialIndex, isSideEvent3DPuzzle, squareOnePieceKind, squareOneVisualSlots, squareOneWedgeUnits, squareSlashPose, squareTurnForAnimation } from "./SideEvent3DObject";

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

  it("maps a fixed Square-1 scramble layout into stable edge/corner slots and U/D stickers", () => {
    const pieces = [16, 17, 11, 0, 1, 8, 9, 10, 18, 19, 20, 15, 2, 3, 4, 12, 13, 14, 21, 22, 23, 5, 6, 7];
    expect(squareOneVisualSlots(pieces, 0).slice(0, 4)).toMatchObject([
      { position: 0, piece: 16, kind: "edge", face: "D" },
      { position: 1, piece: 17, kind: "corner", face: "D" },
      { position: 3, piece: 0, kind: "edge", face: "U" },
      { position: 4, piece: 1, kind: "corner", face: "U" },
    ]);
    expect(squareOneVisualSlots(pieces, 12).slice(0, 3)).toMatchObject([
      { position: 0, piece: 2, kind: "edge", face: "U" },
      { position: 1, piece: 3, kind: "corner", face: "U" },
      { position: 3, piece: 12, kind: "edge", face: "D" },
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
