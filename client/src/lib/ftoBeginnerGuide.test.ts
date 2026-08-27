import { FTO_BEGINNER_GUIDE, FTO_BEGINNER_LESSONS, ftoBeginnerLessonAlgorithmCount, ftoGuideAlgorithmCount } from "./ftoBeginnerGuide";
import { describe, expect, it } from "vitest";

describe("FTO beginner guide", () => {
  it("puts a concrete beginner flow before the Nautilus catalogue", () => {
    expect(FTO_BEGINNER_LESSONS.map((step) => step.id)).toEqual(["white-edges", "first-triple", "remaining-centers", "last-white-corner", "finish-and-advance"]);
    expect(ftoBeginnerLessonAlgorithmCount()).toBe(4);
    expect(FTO_BEGINNER_LESSONS.slice(0, 4).every((step) => step.moves[0]?.setupAlg && step.moves[0]?.resultVi)).toBe(true);
  });

  it("covers an advanced Nautilus path from Last Triple to one-look progression", () => {
    expect(FTO_BEGINNER_GUIDE.map((step) => step.id)).toEqual(["nautilus-grip", "last-triple", "l6x-two-look", "l3c", "one-look-path"]);
    expect(ftoGuideAlgorithmCount()).toBe(6);
  });

  it("keeps verified advanced Last Triple, L6X and L3C algorithms in their respective stages", () => {
    expect(FTO_BEGINNER_GUIDE.find((step) => step.id === "last-triple")?.moves.map((move) => move.algorithm)).toEqual(["R U' R'", "L' U L"]);
    expect(FTO_BEGINNER_GUIDE.find((step) => step.id === "l6x-two-look")?.moves.map((move) => move.algorithm)).toEqual(["r U R' U' R r' L' U' L R U R'", "R' U' F U' R U R' F' U R"]);
    expect(FTO_BEGINNER_GUIDE.find((step) => step.id === "l3c")?.moves[0]?.algorithm).toBe("U R' F' R U' BR U R' F' R U'");
  });

  it("provides one interactive visual and a selected source video for every guide step", () => {
    expect(FTO_BEGINNER_GUIDE.every((step) => step.visual.scramble.trim() && step.visual.focusVi && step.video.youtubeId && step.video.title && step.video.focusVi)).toBe(true);
    expect(new Set(FTO_BEGINNER_GUIDE.map((step) => step.video.youtubeId))).toEqual(new Set(["J8_9no7Ml78", "03L3P1a0Auc"]));
  });

  it("derives setup states as the exact inverse of every advanced algorithm", () => {
    expect(FTO_BEGINNER_GUIDE.find((step) => step.id === "last-triple")?.moves[0]?.setupAlg).toBe("R U R'");
    expect(FTO_BEGINNER_GUIDE.find((step) => step.id === "l3c")?.moves[0]?.setupAlg).toBe("U R' F R U' BR' U R' F R U'");
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

  it("returns every beginner demo setup to the exact FTO solved pattern", async () => {
    const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
    const kpuzzle = await puzzles.fto.kpuzzle();
    const solved = kpuzzle.defaultPattern();
    for (const step of FTO_BEGINNER_LESSONS) {
      for (const move of step.moves) {
        const restored = solved.applyAlg(new Alg(`${move.setupAlg} ${move.algorithm}`));
        expect(restored.patternData).toEqual(solved.patternData);
      }
    }
  });
});
