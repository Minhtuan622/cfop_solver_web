import { describe, expect, it } from "vitest";
import { Puzzle3DCanvas, isSideEvent3DPuzzle } from "./index";

describe("puzzle-3d feature public boundary", () => {
  it("exports the 3D canvas and the shared side-event predicate through the feature barrel", () => {
    expect(typeof Puzzle3DCanvas).toBe("function");
    expect(typeof isSideEvent3DPuzzle).toBe("function");
  });
});
