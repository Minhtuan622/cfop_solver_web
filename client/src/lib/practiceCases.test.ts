import { describe, expect, it } from "vitest";
import { LAST_LAYER_CASES, OLL_CASES, PLL_CASES, practiceCasesByGroup, practiceCasesByKind } from "./practiceCases";
import { OLL_CASES as OLL_MODULE_CASES } from "./practiceCases/oll";
import { PLL_CASES as PLL_MODULE_CASES } from "./practiceCases/pll";

describe("practice case catalog boundaries", () => {
  it("keeps the complete OLL and PLL catalog through the compatibility barrel", () => {
    expect(OLL_CASES).toBe(OLL_MODULE_CASES);
    expect(PLL_CASES).toBe(PLL_MODULE_CASES);
    expect(OLL_CASES).toHaveLength(57);
    expect(PLL_CASES).toHaveLength(21);
    expect(LAST_LAYER_CASES).toHaveLength(78);
    expect(LAST_LAYER_CASES.slice(0, 2).map((practiceCase) => practiceCase.id)).toEqual(["1", "2"]);
    expect(LAST_LAYER_CASES.slice(-2).map((practiceCase) => practiceCase.id)).toEqual(["Gc", "Gd"]);
  });

  it("keeps typed selection by algorithm and case group", () => {
    expect(practiceCasesByKind("OLL")).toBe(OLL_CASES);
    expect(practiceCasesByKind("PLL")).toBe(PLL_CASES);
    expect(OLL_CASES.every((practiceCase) => practiceCase.kind === "OLL")).toBe(true);
    expect(PLL_CASES.every((practiceCase) => practiceCase.kind === "PLL")).toBe(true);
    expect(practiceCasesByGroup("OLL", "Dot").map((practiceCase) => practiceCase.id)).toEqual(["1", "2", "3", "4", "17", "18", "19", "20"]);
    expect(practiceCasesByGroup("PLL", "Edges Only").map((practiceCase) => practiceCase.id)).toEqual(["H", "Z", "Ua", "Ub"]);
  });
});
