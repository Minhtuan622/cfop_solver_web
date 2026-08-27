import { describe, expect, it } from "vitest";
import { CROSS_COLORS, F2L_SLOTS, LAST_LAYER_OPTIONS, OPENING_OPTIONS, lastLayerModeLabel, openingModeLabel, phaseLessonUrl, phaseStudyNote } from "./solverPresentation";

describe("solverPresentation", () => {
  it("keeps the six selectable Cross colors and four F2L slot identifiers", () => {
    expect(CROSS_COLORS.map((color) => color.value)).toEqual(["U", "D", "F", "B", "R", "L"]);
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
