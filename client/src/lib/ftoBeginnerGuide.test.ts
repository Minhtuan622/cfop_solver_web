import { describe, expect, it } from "vitest";
import { FTO_NAUTILUS_WALKTHROUGH, FTO_NAUTILUS_WALKTHROUGH_SCRAMBLE, ftoWalkthroughPhaseAlgorithms, ftoWalkthroughSolution, ftoWalkthroughStateAfter, ftoWalkthroughStateBefore } from "./ftoBeginnerGuide";

describe("FTO Nautilus walkthrough", () => {
  it("uses the documented Nautilus stage order instead of a basic route", () => {
    expect(FTO_NAUTILUS_WALKTHROUGH.map((phase) => phase.id)).toEqual(["first-block", "centers", "last-triple", "last-layer"]);
    expect(FTO_NAUTILUS_WALKTHROUGH.every((phase) => phase.objectiveVi && phase.lookForVi && phase.holdVi && phase.actionsVi.length === 3 && phase.checkVi)).toBe(true);
  });

  it("keeps Last Triple and Last Layer algorithms visible in their correct stages", () => {
    expect(FTO_NAUTILUS_WALKTHROUGH.find((phase) => phase.id === "last-triple")?.algorithm).toBe("R U' R'");
    expect(ftoWalkthroughPhaseAlgorithms(FTO_NAUTILUS_WALKTHROUGH.find((phase) => phase.id === "last-layer")!)).toEqual([
      "r U R' U' R r' L' U' L R U R'",
      "U R' F' R U' BR U R' F' R U'",
    ]);
  });

  it("uses one fixed scramble and carries each After checkpoint into the next Before checkpoint", () => {
    expect(FTO_NAUTILUS_WALKTHROUGH_SCRAMBLE).toBeTruthy();
    for (let index = 0; index < FTO_NAUTILUS_WALKTHROUGH.length - 1; index += 1) {
      expect(ftoWalkthroughStateAfter(index)).toBe(ftoWalkthroughStateBefore(index + 1));
    }
  });

  it("returns the single walkthrough scramble to the exact solved FTO state", async () => {
    const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
    const kpuzzle = await puzzles.fto.kpuzzle();
    const solved = kpuzzle.defaultPattern();
    const restored = solved.applyAlg(new Alg(`${FTO_NAUTILUS_WALKTHROUGH_SCRAMBLE} ${ftoWalkthroughSolution()}`));
    expect(restored.patternData).toEqual(solved.patternData);
  });

  it("derives every displayed checkpoint from that same scramble", async () => {
    const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
    const kpuzzle = await puzzles.fto.kpuzzle();
    const solved = kpuzzle.defaultPattern();
    for (let index = 0; index < FTO_NAUTILUS_WALKTHROUGH.length; index += 1) {
      const before = solved.applyAlg(new Alg(ftoWalkthroughStateBefore(index)));
      const after = solved.applyAlg(new Alg(ftoWalkthroughStateAfter(index)));
      expect(before.patternData).not.toEqual(solved.patternData);
      if (index === FTO_NAUTILUS_WALKTHROUGH.length - 1) expect(after.patternData).toEqual(solved.patternData);
    }
  });
});
