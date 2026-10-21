import { describe, expect, it } from "vitest";
import { F2L_SLOTS, LAST_LAYER_OPTIONS, OPENING_OPTIONS, lastLayerModeLabel, openingModeLabel, phaseLessonUrl, phaseStudyNote } from "./solverPresentation";

describe("solverPresentation", () => {
  it("keeps the four F2L slot identifiers and the selectable opening modes", () => {
    expect(F2L_SLOTS).toEqual(["FR", "FL", "BL", "BR"]);
    expect(OPENING_OPTIONS.map((option) => option.value)).toContain("xxxxcross");
    expect(LAST_LAYER_OPTIONS.map((option) => option.value)).toContain("1lll");
  });

  it("preserves CFOP study links, explanations and labels", () => {
    expect(phaseLessonUrl("xcross_FR")).toContain("F2L");
    expect(phaseLessonUrl("zbll")).toContain("ZBLL");
    expect(phaseStudyNote("oll", "vi")).toContain("mặt trên");
    expect(openingModeLabel("xxxxcross", "vi")).toContain("Full F2L");
    expect(lastLayerModeLabel("oll_pll", "en")).toBe("OLL + PLL · 2 phases");
  });
});
