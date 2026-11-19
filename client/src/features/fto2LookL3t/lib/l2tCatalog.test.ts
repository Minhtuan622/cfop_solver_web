import { describe, expect, it } from "vitest";
import { FTO_2_LOOK_L3T_CASES, FTO_2_LOOK_L3T_GROUPS } from "./l2tData";
import { expandSheetAlgorithm } from "./l2tAlg";
import { L2T_CATALOG, listFto2LookL3tCases } from "./l2tCatalog";

const ALG_TOKEN = /^(?:S'|S|H'|H|r[2']?|R2'|(?:BL|BR|[UDFBLR])(?:2|')?|\{[A-Za-z]{1,2},[A-Za-z]{1,2}\})$/;
const FACE_TURN_TOKEN = /^(?:BL|BR|[UDFBLR])(?:2|')?$/;
const WIDE_TURN_TOKEN = /^r[2']?$/;

describe("FTO 2-Look L3T catalog data", () => {
  it("contains exactly the 44 2-Look L3T cases in practice order", () => {
    expect(FTO_2_LOOK_L3T_CASES).toHaveLength(44);
    expect(new Set(FTO_2_LOOK_L3T_CASES.map(row => row.id)).size).toBe(44);
    expect(FTO_2_LOOK_L3T_CASES.map(row => row.id)).toEqual([
      "PF-1", "PF-2", "PF-3", "PF-4", "PF-5", "PF-6", "PF-8", "PF-9", "PF-10",
      "TCP-A1", "TCP-A1-2", "TCP-A2", "TCP-A2-2", "TCP-A3", "TCP-A3-2",
      "TCP-A4", "TCP-A4-2", "TCP-A5", "TCP-A5-2", "TCP-A6", "TCP-A6-2",
      "TCP-B1", "TCP-B1-2", "TCP-B2", "TCP-B2-2", "TCP-B3", "TCP-B3-2",
      "TCP-B4", "TCP-B4-2", "TCP-B5", "TCP-B5-2", "TCP-B6", "TCP-B6-2",
      "TCP-C1", "TCP-C1-2", "TCP-C2", "TCP-C2-2", "TCP-C3", "TCP-C3-2",
      "TCP-C4", "TCP-C4-2", "TCP-C5", "TCP-C5-2", "TCP-C6",
    ]);
    expect(FTO_2_LOOK_L3T_GROUPS).toEqual(["PF", "TCP A", "TCP B", "TCP C"]);
  });

  it("assigns each case to its family group", () => {
    const groups = FTO_2_LOOK_L3T_CASES.map(row => row.group);
    expect(groups.filter(group => group === "PF")).toHaveLength(9);
    expect(groups.filter(group => group === "TCP A")).toHaveLength(12);
    expect(groups.filter(group => group === "TCP B")).toHaveLength(12);
    expect(groups.filter(group => group === "TCP C")).toHaveLength(11);
  });

  it("keeps every algorithm in the sheet's token alphabet", () => {
    for (const row of FTO_2_LOOK_L3T_CASES) {
      expect(row.family).toBe("l3t2");
      expect(row.algorithm.trim().length).toBeGreaterThan(0);
      for (const token of row.algorithm.split(/\s+/)) {
        expect(ALG_TOKEN.test(token), `${row.id}: "${token}"`).toBe(true);
      }
    }
  });

  it("expands every algorithm into plain FTO face turns", () => {
    for (const row of FTO_2_LOOK_L3T_CASES) {
      const expanded = expandSheetAlgorithm(row.algorithm);
      expect(expanded.length).toBeGreaterThan(0);
      for (const token of expanded.split(" ")) {
        const known = FACE_TURN_TOKEN.test(token) || WIDE_TURN_TOKEN.test(token);
        expect(known, `${row.id}: "${token}"`).toBe(true);
      }
    }
  });

  it("builds catalog rows with the sentinel state and groups by family", () => {
    expect(L2T_CATALOG).toHaveLength(44);
    expect(L2T_CATALOG.every(row => row.state === `l3t2:${row.id}`)).toBe(true);
    expect(listFto2LookL3tCases({ query: "R U' R' U" }).length).toBeGreaterThan(0);
    expect(listFto2LookL3tCases({ query: "no such move" })).toHaveLength(0);
    expect(listFto2LookL3tCases({ limit: 4 })).toHaveLength(4);
  });
});
