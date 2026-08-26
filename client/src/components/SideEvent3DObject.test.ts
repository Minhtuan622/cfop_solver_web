import { describe, expect, it } from "vitest";
import { isSideEvent3DPuzzle } from "./SideEvent3DObject";

describe("side-event 3D renderer selection", () => {
  it("uses the custom Three.js state renderer only for Square-1 and Clock", () => {
    expect(isSideEvent3DPuzzle("square1")).toBe(true);
    expect(isSideEvent3DPuzzle("clock")).toBe(true);
    expect(isSideEvent3DPuzzle("skewb")).toBe(false);
    expect(isSideEvent3DPuzzle("megaminx")).toBe(false);
  });
});
