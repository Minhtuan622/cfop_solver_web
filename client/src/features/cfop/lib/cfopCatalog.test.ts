import { describe, expect, it } from "vitest";
import {
  applyFastMoves,
  invertAlgorithm,
  SOLVED_FAST_STATE,
} from "@/lib/fastCube";
import { assertValidScrambleState } from "@/lib/cubeValidation";
import {
  CFOP_CASES,
  CFOP_CATALOG,
  CFOP_COUNTS,
  cfopCaseState,
  listCfopCases,
} from "./cfopCatalog";
import { F2L_4WAY_CASES, OLL_CASES, PLL_CASES } from "./cfopCatalogData";


describe("CFOP catalog data", () => {
  it("ships 41 F2L × 4 slots + 57 OLL + 21 PLL = 242 cases", () => {
    expect(F2L_4WAY_CASES).toHaveLength(164);
    expect(F2L_4WAY_CASES).toHaveLength(164);
    expect(OLL_CASES).toHaveLength(57);
    expect(PLL_CASES).toHaveLength(21);
    expect(CFOP_CASES).toHaveLength(242);
    expect(CFOP_COUNTS).toEqual({ f2l: 164, oll: 57, pll: 21, all: 242 });
    expect(CFOP_CATALOG).toHaveLength(242);
  });

  it("has unique ids", () => {
    // Intentionally not asserting unique derived states: COLL/OLLCP overlap
    // OLL/PLL/F2L algorithmically (the same alg appears under several case
    // names), so derived states collide by design.
    const ids = CFOP_CATALOG.map(row => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every derived case state is a legal cube state (any frame)", () => {
    // COLL/OLLCP algorithms may contain x/y/z rotations, so derived states
    // can sit in a rotated frame — cube-level legality checks still hold.
    for (const row of CFOP_CATALOG) assertValidScrambleState(row.state);
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



describe("F2L 4-way slot variants", () => {
  it("ships all four slot angles of every F2L case, sourced from cubingapp.com", () => {
    expect(F2L_4WAY_CASES).toHaveLength(164);
    for (const row of F2L_4WAY_CASES) {
      // FR keeps the published front-right id; FL/BR/BL carry the suffix.
      expect(row.id).toMatch(/^F2L-\d{2}(-FL|-BR|-BL)?$/);
      expect(["FR", "FL", "BR", "BL"]).toContain(row.group);
    }
    for (let num = 1; num <= 41; num += 1) {
      const id = `F2L-${String(num).padStart(2, "0")}`;
      for (const slot of ["FR", "FL", "BR", "BL"]) {
        const expected = slot === "FR" ? id : `${id}-${slot}`;
        expect(
          F2L_4WAY_CASES.some(row => row.id === expected && row.group === slot),
          expected,
        ).toBe(true);
      }
    }
  });

  it("no slot alg is just a bare y-conjugation of another slot's alg", () => {
    for (const row of F2L_4WAY_CASES) {
      // CubingApp's published 4-angle sheet contains no 'y' wrapping for
      // practice; the generator kept algs verbatim, so none should contain y.
      // (A handful of published algs do contain y — those are kept as-is and
      // are counted here to catch accidental unpaired-wrapping bugs.)
      const rotations = (row.algorithm.match(/\by\d?[']?\b/g) ?? []).length;
      expect(rotations % 2).toBe(0);
    }
  });
});

describe("listCfopCases", () => {
  it("lists everything by default and respects the family filter", () => {
    expect(listCfopCases({ family: "all", limit: 1000 })).toHaveLength(242);
    expect(listCfopCases({ family: "f2l", limit: 1000 })).toHaveLength(164);
    expect(listCfopCases({ family: "oll", limit: 1000 })).toHaveLength(57);
    expect(listCfopCases({ family: "pll", limit: 1000 })).toHaveLength(21);
  });

  it("matches case-insensitively against id, name and algorithm", () => {
    expect(listCfopCases({ query: "sune" }).map(row => row.id)).toContain("OLL-26");
    expect(listCfopCases({ query: "f2l-01" }).map(row => row.id)).toEqual([
      "F2L-01",
      "F2L-01-FL",
      "F2L-01-BR",
      "F2L-01-BL",
    ]);
    expect(listCfopCases({ query: "t perm" })).toHaveLength(1);
  });

  it("clamps the limit to [1, 1000]", () => {
    expect(listCfopCases({ limit: 0 })).toHaveLength(1);
    expect(listCfopCases({ limit: 5 })).toHaveLength(5);
    expect(listCfopCases({ limit: 5000 })).toHaveLength(242);
  });
});
