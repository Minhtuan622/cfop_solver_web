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
    expect(FTO_BEGINNER_GUIDE.every((step) => step.visual.scramble.trim() && step.visual.focusVi && step.visual.targetFocus && step.video.youtubeId && step.video.title && step.video.focusVi)).toBe(true);
    expect(new Set(FTO_BEGINNER_GUIDE.map((step) => step.video.youtubeId))).toEqual(new Set(["J8_9no7Ml78", "03L3P1a0Auc"]));
  });
});
