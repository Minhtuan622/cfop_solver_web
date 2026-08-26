import { describe, expect, it } from "vitest";
import { isSideEvent3DPuzzle, squareTurnForAnimation } from "./SideEvent3DObject";

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
});
