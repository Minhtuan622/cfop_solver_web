import { describe, expect, it } from "vitest";
import { FTO_2_LOOK_L3T_CASES, FTO_2_LOOK_L3T_GROUPS } from "./l2tData";
import { fto2LookL3tScrambleOf, toCubingNotation } from "./l2tAlg";
import { L2T_CATALOG, listFto2LookL3tCases } from "./l2tCatalog";

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

  it("keeps every algorithm free of groupings and empty", () => {
    for (const row of FTO_2_LOOK_L3T_CASES) {
      expect(row.algorithm).not.toMatch(/[[\]{}()]/);
      expect(row.algorithm.trim().length).toBeGreaterThan(0);
      expect(row.family).toBe("l3t2");
    }
  });

  it("builds catalog rows with the sentinel state and groups by family", () => {
    expect(L2T_CATALOG).toHaveLength(44);
    expect(L2T_CATALOG.every(row => row.state === `l3t2:${row.id}`)).toBe(true);
    expect(listFto2LookL3tCases({ query: "R U' R' U" }).length).toBeGreaterThan(0);
    expect(listFto2LookL3tCases({ query: "no such move" })).toHaveLength(0);
    expect(listFto2LookL3tCases({ limit: 4 })).toHaveLength(4);
  });

  it("inverts each algorithm into an inverse of the same length", () => {
    for (const row of FTO_2_LOOK_L3T_CASES) {
      const tokens = toCubingNotation(row.algorithm).split(" ");
      const scramble = fto2LookL3tScrambleOf(row.algorithm);
      expect(scramble.split(" ")).toHaveLength(tokens.length);
      expect(scramble).toBe(
        [...tokens].reverse().map(token =>
          token.endsWith("2") ? token : token.endsWith("'") ? token.slice(0, -1) : `${token}'`,
        ).join(" "),
      );
    }
  });
});
