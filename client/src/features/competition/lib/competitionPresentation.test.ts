import { describe, expect, it } from "vitest";
import { competitionEventLabel, competitionResultLabel, formatDescriptions, formatLabels } from "@/features/competition/lib/competitionPresentation";

describe("competitionPresentation", () => {
  it("keeps competition format labels and legacy event fallback", () => {
    expect(formatLabels.best_of_3).toBe("Best of 3");
    expect(formatDescriptions.ao12).toContain("12 lượt");
    expect(competitionEventLabel("333oh")).toBe("3×3 OH");
    expect(competitionEventLabel("unknown")).toBe("3×3×3");
  });

  it("formats standard, penalized and multi-blind room results", () => {
    expect(competitionResultLabel({ elapsedMs: 12_340, penalty: "none" }, "333")).toBe("00:12.33");
    expect(competitionResultLabel({ elapsedMs: 12_340, penalty: "+2" }, "333")).toBe("00:14.33 +2");
    expect(competitionResultLabel({ elapsedMs: 12_340, penalty: "DNF" }, "333")).toBe("DNF");
    expect(competitionResultLabel({ elapsedMs: 12_340, penalty: "none", multiBlindScore: 5 }, "333mbf")).toContain("5 điểm");
  });
});
