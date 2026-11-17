import { describe, expect, it } from "vitest";
import {
  applyFastMoves,
  invertAlgorithm,
  SOLVED_FAST_STATE,
} from "@/lib/fastCube";
import { assertValidCubeState } from "@/lib/cubeValidation";
import {
  CFOP_CASES,
  CFOP_CATALOG,
  CFOP_COUNTS,
  cfopCaseState,
  listCfopCases,
} from "./cfopCatalog";
import { F2L_CASES, OLL_CASES, PLL_CASES } from "./cfopCatalogData";


describe("CFOP catalog data", () => {
  it("ships 41 F2L + 57 OLL + 21 PLL = 119 cases", () => {
    expect(F2L_CASES).toHaveLength(41);
    expect(OLL_CASES).toHaveLength(57);
    expect(PLL_CASES).toHaveLength(21);
    expect(CFOP_CASES).toHaveLength(119);
    expect(CFOP_COUNTS).toEqual({ f2l: 41, oll: 57, pll: 21, all: 119 });
    expect(CFOP_CATALOG).toHaveLength(119);
  });

  it("has unique ids and unique derived states", () => {
    const ids = CFOP_CATALOG.map(row => row.id);
    expect(new Set(ids).size).toBe(ids.length);
    const states = CFOP_CATALOG.map(row => row.state);
    expect(new Set(states).size).toBe(states.length);
  });

  it("every derived case state is a legal cube state", () => {
    for (const row of CFOP_CATALOG) assertValidCubeState(row.state);
  });

  it("every algorithm solves its own derived case state", () => {
    for (const row of CFOP_CATALOG) {
      expect(
        applyFastMoves(cfopCaseState(row), row.algorithm),
        row.id,
      ).toBe(SOLVED_FAST_STATE);
    }
  });

  it("invertAlgorithm is a true inverse for every case algorithm", () => {
    for (const row of CFOP_CATALOG) {
      expect(
        applyFastMoves(
          applyFastMoves(SOLVED_FAST_STATE, row.algorithm),
          invertAlgorithm(row.algorithm),
        ),
        row.id,
      ).toBe(SOLVED_FAST_STATE);
    }
  });
});



describe("listCfopCases", () => {
  it("lists everything by default and respects the family filter", () => {
    expect(listCfopCases({ family: "all", limit: 1000 })).toHaveLength(119);
    expect(listCfopCases({ family: "f2l", limit: 1000 })).toHaveLength(41);
    expect(listCfopCases({ family: "oll", limit: 1000 })).toHaveLength(57);
    expect(listCfopCases({ family: "pll", limit: 1000 })).toHaveLength(21);
  });

  it("matches case-insensitively against id, name and algorithm", () => {
    expect(listCfopCases({ query: "sune" }).map(row => row.id)).toContain("OLL-26");
    expect(listCfopCases({ query: "f2l-01" }).map(row => row.id)).toEqual(["F2L-01"]);
    expect(listCfopCases({ query: "t perm" })).toHaveLength(1);
  });

  it("clamps the limit to [1, 1000]", () => {
    expect(listCfopCases({ limit: 0 })).toHaveLength(1);
    expect(listCfopCases({ limit: 5 })).toHaveLength(5);
    expect(listCfopCases({ limit: 5000 })).toHaveLength(119);
  });
});
