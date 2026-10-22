import { describe, expect, it } from "vitest";
import { puzzleBaseRoll, puzzleDefaultYaw, puzzleInitialOrbit, puzzlePreviewBaseRoll, puzzlePreviewDistance, puzzlePreviewSetupAlgorithm } from "./puzzleFraming";

describe("Puzzle3DCanvas framing", () => {
  it("moves the default white U face of FTO to the viewer's left without rolling other puzzles", () => {
    expect(puzzleBaseRoll("fto")).toBe(Math.PI / 2);
    expect(puzzleBaseRoll("pyraminx")).toBe(0);
    expect(puzzleBaseRoll("square1")).toBe(0);
    expect(puzzleDefaultYaw("fto")).toBeGreaterThan(0);
    expect(puzzleDefaultYaw("pyraminx")).toBeLessThan(0);
  });

  it("reserves a face-forward orbit for the Bencisco white-center teaching example only", () => {
    expect(puzzleInitialOrbit("fto", true)).toEqual({ yaw: 0, pitch: 0 });
    expect(puzzleInitialOrbit("fto")).toEqual({ yaw: puzzleDefaultYaw("fto"), pitch: 0.32 });
    expect(puzzleInitialOrbit("pyraminx", true)).toEqual({ yaw: puzzleDefaultYaw("pyraminx"), pitch: 0.32 });
    expect(puzzlePreviewBaseRoll("fto", true)).toBe(0);
    expect(puzzlePreviewBaseRoll("fto")).toBe(Math.PI / 2);
    expect(puzzlePreviewDistance("fto", 5.95, true)).toBe(3.9);
    expect(puzzlePreviewDistance("fto", 5.95)).toBe(5.95);
    expect(puzzlePreviewSetupAlgorithm("fto", "R U' 2R", true)).toBe("R U' 2R");
    expect(puzzlePreviewSetupAlgorithm("fto", "R U' 2R")).toBe("R U' 2R");
  });

});
