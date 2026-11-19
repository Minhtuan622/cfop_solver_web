import { describe, expect, it } from "vitest";
import { FTO_L3T_CASES, FTO_L3T_GROUPS } from "./l3tData";
import { expandSheetAlgorithm } from "./l3tAlg";
import { L3T_CATALOG, listFtoL3tCases } from "./l3tCatalog";

const ALG_TOKEN = /^(?:S'|S|H'|H|r[2']?|R2'|(?:BL|BR|[UDFBLR])(?:2|')?|\{[A-Za-z]{1,2},[A-Za-z]{1,2}\})$/;
const FACE_TURN_TOKEN = /^(?:BL|BR|[UDFBLR])(?:2|')?$/;
const WIDE_TURN_TOKEN = /^r[2']?$/;

describe("FTO L3T catalog data", () => {
  it("contains exactly the 17 3-Look L3T cases in practice order", () => {
    expect(FTO_L3T_CASES).toHaveLength(17);
    expect(new Set(FTO_L3T_CASES.map(row => row.id)).size).toBe(17);
    expect(FTO_L3T_CASES.map(row => row.id)).toEqual([
      "PF-1", "PF-2", "PF-3", "PF-4", "PF-5", "PF-6", "PF-8", "PF-9", "PF-10",
      "TL-1", "TL-2", "TL-3", "TL-4", "TL-5",
      "LT-1", "LT-2", "LT-3",
    ]);
    expect(FTO_L3T_GROUPS).toEqual(["PF", "TL", "LT"]);
  });

  it("assigns each case to its phase group", () => {
    const groups = FTO_L3T_CASES.map(row => row.group);
    expect(groups.filter(group => group === "PF")).toHaveLength(9);
    expect(groups.filter(group => group === "TL")).toHaveLength(5);
    expect(groups.filter(group => group === "LT")).toHaveLength(3);
  });

  it("keeps every algorithm in the sheet's token alphabet", () => {
    for (const row of FTO_L3T_CASES) {
      expect(row.family).toBe("l3t");
      expect(row.algorithm.trim().length).toBeGreaterThan(0);
      for (const token of row.algorithm.split(/\s+/)) {
        expect(ALG_TOKEN.test(token), `${row.id}: "${token}"`).toBe(true);
      }
    }
  });

  it("expands every algorithm into plain FTO face turns", () => {
    for (const row of FTO_L3T_CASES) {
      const expanded = expandSheetAlgorithm(row.algorithm);
      expect(expanded.length).toBeGreaterThan(0);
      for (const token of expanded.split(" ")) {
        const known = FACE_TURN_TOKEN.test(token) || WIDE_TURN_TOKEN.test(token);
        expect(known, `${row.id}: "${token}"`).toBe(true);
      }
    }
  });

  it("builds catalog rows with the sentinel state and groups by PF/TL/LT", () => {
    expect(L3T_CATALOG).toHaveLength(17);
    expect(L3T_CATALOG.every(row => row.state === `l3t:${row.id}`)).toBe(true);
    expect(listFtoL3tCases({ query: "R U' R' U" }).length).toBeGreaterThan(0);
    expect(listFtoL3tCases({ query: "no such move" })).toHaveLength(0);
    expect(listFtoL3tCases({ limit: 4 })).toHaveLength(4);
  });
});
