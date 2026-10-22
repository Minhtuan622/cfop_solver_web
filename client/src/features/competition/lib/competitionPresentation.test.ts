import { describe, expect, it } from "vitest";
import { competitionEventLabel, competitionResultLabel, formatDescriptionKey, formatLabels } from "@/features/competition/lib/competitionPresentation";
import { translate } from "@/lib/i18n";

const t = (key: string, params?: Record<string, string | number>) => translate("vi", key, params);

describe("competitionPresentation", () => {
  it("keeps competition format labels and legacy event fallback", () => {
    expect(formatLabels.best_of_3).toBe("Best of 3");
    expect(t(formatDescriptionKey.ao12)).toContain("12 lượt");
    expect(competitionEventLabel("333oh", "vi")).toBe("3×3 OH");
    expect(competitionEventLabel("unknown", "vi")).toBe("3×3×3");
  });

  it("formats standard, penalized and multi-blind room results", () => {
    expect(competitionResultLabel({ elapsedMs: 12_340, penalty: "none" }, "333", t)).toBe("00:12.33");
    expect(competitionResultLabel({ elapsedMs: 12_340, penalty: "+2" }, "333", t)).toBe("00:14.33 +2");
    expect(competitionResultLabel({ elapsedMs: 12_340, penalty: "DNF" }, "333", t)).toBe("DNF");
    expect(competitionResultLabel({ elapsedMs: 12_340, penalty: "none", multiBlindScore: 5 }, "333mbf", t)).toContain("5 điểm");
  });
});
