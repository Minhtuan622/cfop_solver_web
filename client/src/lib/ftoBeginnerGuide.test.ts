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
});
