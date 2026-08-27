import { describe, expect, it } from "vitest";
import {
  FTO_NAUTILUS_1LLL_CAPSTONE,
  FTO_NAUTILUS_WALKTHROUGH,
  FTO_NAUTILUS_WALKTHROUGH_SCRAMBLE,
  ftoWalkthroughSolution,
  ftoWalkthroughStateAfter,
  ftoWalkthroughStateBefore,
} from "./ftoBeginnerGuide";

describe("FTO advanced Nautilus walkthrough", () => {
  it("uses only Advanced Last Triple, one-look L6X, and one-look L3C in its main path", () => {
    expect(FTO_NAUTILUS_WALKTHROUGH.map((phase) => phase.id)).toEqual(["last-triple-advanced", "l6x-one-look", "l3c-one-look"]);
    expect(FTO_NAUTILUS_WALKTHROUGH.find((phase) => phase.id === "last-triple-advanced")?.algorithm).toBe("F' R' L R L' F R U' R'");
    expect(FTO_NAUTILUS_WALKTHROUGH.find((phase) => phase.id === "l6x-one-look")?.algorithm).toBe("L U L' U L U L'");
    expect(FTO_NAUTILUS_WALKTHROUGH.find((phase) => phase.id === "l3c-one-look")?.algorithm).toBe("U R' F R U' BR' U R' F R U'");
  });

  it("keeps recognition, grip, action, and checkpoint guidance for every advanced stage", () => {
    expect(FTO_NAUTILUS_WALKTHROUGH.every((phase) => phase.objectiveVi && phase.lookForVi && phase.holdVi && phase.actionsVi.length === 3 && phase.checkVi)).toBe(true);
  });

  it("uses one fixed scramble and carries every After state into the next Before state", () => {
    expect(FTO_NAUTILUS_WALKTHROUGH_SCRAMBLE).toBeTruthy();
    for (let index = 0; index < FTO_NAUTILUS_WALKTHROUGH.length - 1; index += 1) {
      expect(ftoWalkthroughStateAfter(index)).toBe(ftoWalkthroughStateBefore(index + 1));
    }
  });

  it("returns the single advanced walkthrough scramble to the exact solved FTO state", async () => {
    const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
    const kpuzzle = await puzzles.fto.kpuzzle();
    const solved = kpuzzle.defaultPattern();
    const restored = solved.applyAlg(new Alg(`${FTO_NAUTILUS_WALKTHROUGH_SCRAMBLE} ${ftoWalkthroughSolution()}`));
    expect(restored.patternData).toEqual(solved.patternData);
  });

  it("keeps 1LLL as a separate direct one-look final-layer branch", async () => {
    const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
    const kpuzzle = await puzzles.fto.kpuzzle();
    const solved = kpuzzle.defaultPattern();
    const restored = solved.applyAlg(new Alg(`${FTO_NAUTILUS_1LLL_CAPSTONE.setupAlg} ${FTO_NAUTILUS_1LLL_CAPSTONE.algorithm}`));
    expect(restored.patternData).toEqual(solved.patternData);
    expect(FTO_NAUTILUS_1LLL_CAPSTONE.objectiveVi).toMatch(/nhánh thay thế/i);
    expect(FTO_NAUTILUS_1LLL_CAPSTONE.sourceUrl).toContain("docs.google.com/spreadsheets");
  });
});
