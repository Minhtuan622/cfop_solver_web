import { FTO_BEGINNER_GUIDE, ftoGuideAlgorithmCount } from "./ftoBeginnerGuide";
import { describe, expect, it } from "vitest";

describe("FTO beginner guide", () => {
  it("covers a complete beginner path from orientation through centres", () => {
    expect(FTO_BEGINNER_GUIDE.map((step) => step.id)).toEqual(["orient", "up-edges", "middle-edges", "vertices", "centres", "finish"]);
    expect(ftoGuideAlgorithmCount()).toBe(6);
  });

  it("keeps the edge, vertex and centre algorithms visible in their respective steps", () => {
    expect(FTO_BEGINNER_GUIDE.find((step) => step.id === "middle-edges")?.moves.map((move) => move.algorithm)).toEqual(["R' D R", "L D' L'"]);
    expect(FTO_BEGINNER_GUIDE.find((step) => step.id === "centres")?.moves[0]?.algorithm).toBe("(r U r' U') × 5");
  });

  it("provides one interactive visual and a selected source video for every guide step", () => {
    expect(FTO_BEGINNER_GUIDE.every((step) => step.visual.scramble.trim() && step.visual.focusVi && step.video.youtubeId && step.video.title && step.video.focusVi)).toBe(true);
    expect(new Set(FTO_BEGINNER_GUIDE.map((step) => step.video.youtubeId))).toEqual(new Set(["J8_9no7Ml78", "03L3P1a0Auc"]));
  });

  it("uses inverse setup states so the documented algorithms restore the exact visual", () => {
    expect(FTO_BEGINNER_GUIDE.find((step) => step.id === "middle-edges")?.visual.scramble).toBe("R' D' R");
    expect(FTO_BEGINNER_GUIDE.find((step) => step.id === "vertices")?.visual.scramble).toBe("U' R U R'");
    expect(FTO_BEGINNER_GUIDE.find((step) => step.id === "centres")?.visual.scramble).toBe("U r U' r' U r U' r' U r U' r' U r U' r' U r U' r'");
  });

  it("returns every replay setup to the exact FTO solved pattern with its documented formula", async () => {
    const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
    const kpuzzle = await puzzles.fto.kpuzzle();
    const solved = kpuzzle.defaultPattern();
    for (const step of FTO_BEGINNER_GUIDE) {
      for (const move of step.moves) {
        const restored = solved.applyAlg(new Alg(`${move.setupAlg} ${move.algorithm.replace(" × 5", "5")}`));
        expect(restored.patternData).toEqual(solved.patternData);
      }
    }
  });
});
