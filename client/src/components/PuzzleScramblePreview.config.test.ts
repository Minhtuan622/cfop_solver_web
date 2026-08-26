import { describe, expect, it } from "vitest";
import { puzzleScramblePreviewConfig } from "./PuzzleScramblePreview";

describe("puzzleScramblePreviewConfig", () => {
  it("builds a static scrambled preview config for each supported puzzle", () => {
    expect(puzzleScramblePreviewConfig("222", "R U R'")).toMatchObject({ puzzle: "2x2x2", experimentalSetupAlg: "R U R'", alg: "", visualization: "3D", controlPanel: "none" });
    expect(puzzleScramblePreviewConfig("pyram", "R U' L")).toMatchObject({ puzzle: "pyraminx", experimentalSetupAlg: "R U' L", alg: "", visualization: "3D", controlPanel: "none" });
    expect(puzzleScramblePreviewConfig("minx", "R++ D--")).toMatchObject({ puzzle: "megaminx", experimentalSetupAlg: "R++ D--", alg: "", visualization: "3D", controlPanel: "none" });
  });

  it("does not claim a visual preview for unsupported puzzles", () => {
    expect(puzzleScramblePreviewConfig("444", "Rw U2")).toBeNull();
  });
});
