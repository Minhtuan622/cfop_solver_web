import { describe, expect, it } from "vitest";
import { previewNeedsExternal3DModule, puzzleScramblePreviewConfig } from "./PuzzleScramblePreview";

describe("puzzleScramblePreviewConfig", () => {
  it("builds a static scrambled preview config for each supported puzzle", () => {
    expect(puzzleScramblePreviewConfig("222", "R U R'")).toMatchObject({ puzzle: "2x2x2", experimentalSetupAlg: "R U R'", alg: "", visualization: "3D", controlPanel: "none" });
    expect(puzzleScramblePreviewConfig("pyram", "R U' L")).toMatchObject({ puzzle: "pyraminx", experimentalSetupAlg: "R U' L", alg: "", visualization: "3D", controlPanel: "none" });
    expect(puzzleScramblePreviewConfig("skewb", "R U' B")).toMatchObject({ puzzle: "skewb", experimentalSetupAlg: "R U' B", visualization: "3D" });
    expect(puzzleScramblePreviewConfig("minx", "R++ D--")).toMatchObject({ puzzle: "megaminx", experimentalSetupAlg: "R++ D--", alg: "", visualization: "3D", controlPanel: "none" });
    expect(puzzleScramblePreviewConfig("fto", "U R BR'" )).toMatchObject({ puzzle: "fto", experimentalSetupAlg: "U R BR'", alg: "", visualization: "3D", controlPanel: "none" });
    expect(puzzleScramblePreviewConfig("sq1", "(1, 0) / (3, -2) /")).toMatchObject({ puzzle: "square1", experimentalSetupAlg: "(1, 0) / (3, -2) /", visualization: "3D" });
    expect(puzzleScramblePreviewConfig("clock", "UR3+ DR2+ y2")).toMatchObject({ puzzle: "clock", experimentalSetupAlg: "UR3+ DR2+ y2", visualization: "3D" });
    expect(puzzleScramblePreviewConfig("444", "Rw U2")).toMatchObject({ puzzle: "4x4x4", experimentalSetupAlg: "Rw U2", visualization: "3D" });
    expect(puzzleScramblePreviewConfig("777", "3Rw U2")).toMatchObject({ puzzle: "7x7x7", experimentalSetupAlg: "3Rw U2", visualization: "3D" });
  });

  it("leaves CSS previews out of the external Cubing/Three chunk", () => {
    expect(puzzleScramblePreviewConfig("333", "R U")).toBeNull();
    expect(previewNeedsExternal3DModule("333")).toBe(false);
    expect(previewNeedsExternal3DModule("222")).toBe(false);
    expect(previewNeedsExternal3DModule("444")).toBe(true);
    expect(previewNeedsExternal3DModule("sq1")).toBe(true);
  });
});
