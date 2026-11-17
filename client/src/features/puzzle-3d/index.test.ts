import { describe, expect, it } from "vitest";
import { Puzzle3DCanvas, isSideEvent2DPuzzle } from "./index";

describe("puzzle-3d feature public boundary", () => {
  it("exports the preview canvas and the shared side-event predicate through the feature barrel", () => {
    expect(typeof Puzzle3DCanvas).toBe("function");
    expect(typeof isSideEvent2DPuzzle).toBe("function");
  });

  it("only routes Square-1 and Clock to the 2D preview", () => {
    expect(isSideEvent2DPuzzle("square1")).toBe(true);
    expect(isSideEvent2DPuzzle("clock")).toBe(true);
    expect(isSideEvent2DPuzzle("skewb")).toBe(false);
    expect(isSideEvent2DPuzzle("megaminx")).toBe(false);
    expect(isSideEvent2DPuzzle("3x3x3")).toBe(false);
  });
});
