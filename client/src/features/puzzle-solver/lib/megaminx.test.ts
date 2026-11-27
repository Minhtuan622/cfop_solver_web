import { describe, expect, it } from "vitest";
import { solveMegaminxLayers } from "./megaminxEngine";

describe("megaminx layer by layer", () => {
  it("solves random WCA scrambles in layer order and the moves really solve the puzzle", async () => {
    const [{ puzzles }, { Alg }, { randomScrambleForEvent }] = await Promise.all([
      import("cubing/puzzles"),
      import("cubing/alg"),
      import("cubing/scramble"),
    ]);
    const kpuzzle = await puzzles.megaminx.kpuzzle();
    for (let run = 0; run < 4; run += 1) {
      const scramble = (await randomScrambleForEvent("minx")).toString();
      const found = await solveMegaminxLayers(null, scramble);
      const names = found.phases.map(phase => phase.name).filter(name => name !== "Rotation");
      expect(names).toEqual([
        "Star",
        "First Layer Corners",
        "Second Layer",
        "Third Layer",
        "Fourth Layer",
        "Last Layer",
      ]);
      const after = kpuzzle.defaultPattern().applyAlg(new Alg(scramble)).applyAlg(new Alg(found.solution));
      const solved = kpuzzle.defaultPattern();
      expect(after.patternData.CORNERS).toEqual(solved.patternData.CORNERS);
      expect(after.patternData.EDGES).toEqual(solved.patternData.EDGES);
      expect(after.patternData.CENTERS.pieces).toEqual(solved.patternData.CENTERS.pieces);
    }
  }, 120_000);

  it("an already solved puzzle needs no moves", async () => {
    const found = await solveMegaminxLayers(null, "");
    expect(found.solution).toBe("");
  });
});
