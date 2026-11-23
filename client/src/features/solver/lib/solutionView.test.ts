import { describe, expect, it } from "vitest";
import type { SolverResult } from "@/lib/solverRuntime";
import { lastLayerCaseOf, openingOutcomeOf, phaseAt, xcrossSlotsOf } from "./solutionView";

const phase = (name: string, start: number, end: number, caseId: string | null = null) => ({
  name,
  algorithm: "",
  moves: Array.from({ length: end - start }, () => "R"),
  state_after: "",
  valid_after: true,
  predicate_after: true,
  case_id: caseId,
  start,
  end,
});

const result = (phases: ReturnType<typeof phase>[]) => ({ phases }) as unknown as SolverResult;

describe("solutionView", () => {
  it("tìm phase theo vị trí con trỏ; vị trí 0 không thuộc phase nào", () => {
    const solved = result([phase("xcross_FR", 0, 7), phase("f2l_FL", 7, 15), phase("zbll", 15, 15, "U-3")]);
    expect(phaseAt(solved, 0)).toBeNull();
    expect(phaseAt(null, 3)).toBeNull();
    expect(phaseAt(solved, 1)?.name).toBe("xcross_FR");
    expect(phaseAt(solved, 7)?.name).toBe("xcross_FR");
    expect(phaseAt(solved, 8)?.name).toBe("f2l_FL");
    expect(phaseAt(solved, 15)?.name).toBe("f2l_FL");
  });

  it("đọc slot XCross..XXXXCross từ tên phase", () => {
    expect(xcrossSlotsOf("xcross_FR")).toEqual(["FR"]);
    expect(xcrossSlotsOf("xxcross_FR_FL")).toEqual(["FR", "FL"]);
    expect(xcrossSlotsOf("xxxcross_FR_FL_BL")).toEqual(["FR", "FL", "BL"]);
    expect(xcrossSlotsOf("xxxxcross_FR_FL_BL_BR")).toEqual(["FR", "FL", "BL", "BR"]);
    expect(xcrossSlotsOf("cross")).toBeUndefined();
    expect(xcrossSlotsOf(undefined)).toBeUndefined();
  });

  it("chỉ ZBLL/1LLL có case_id mới có case Last Layer", () => {
    expect(lastLayerCaseOf(phase("zbll", 0, 1, "U-3"))).toEqual({ family: "zbll", id: "U-3" });
    expect(lastLayerCaseOf(phase("1lll", 0, 1, null))).toBeUndefined();
    expect(lastLayerCaseOf(phase("oll", 0, 1, "OLL-1"))).toBeUndefined();
    expect(lastLayerCaseOf(null)).toBeUndefined();
  });

  it("tóm tắt bước mở đầu", () => {
    expect(openingOutcomeOf(null)).toBeNull();
    expect(openingOutcomeOf(result([phase("cross", 0, 6)]))).toEqual({ kind: "cross", slot: null, moves: 6 });
    expect(openingOutcomeOf(result([phase("xcross_BR", 0, 8)]))).toEqual({ kind: "xcross", slot: "BR", moves: 8 });
    expect(openingOutcomeOf(result([phase("xxcross_FR_FL", 0, 9)]))).toEqual({ kind: "xxcross", slots: ["FR", "FL"], moves: 9 });
    expect(openingOutcomeOf(result([phase("xxxxcross_FR_FL_BL_BR", 0, 12)]))).toEqual({ kind: "xxxxcross", slots: ["FR", "FL", "BL", "BR"], moves: 12 });
  });
});
