import { describe, expect, it } from "vitest";
import {
  applyTwoByTwoMoves,
  solvesTwoByTwoCase,
  TWO_BY_TWO_SOLVED,
} from "./twoByTwoCube";
import {
  TWO_BY_TWO_CATALOG,
  TWO_BY_TWO_COUNTS,
  TWO_BY_TWO_GROUPS_BY_SET,
  CLL_GROUPS,
  PBL_GROUPS,
  listTwoByTwoCases,
  twoByTwoCaseStateOf,
  twoByTwoCatalogOf,
} from "./twoByTwoCatalog";
import { CLL_CASES, PBL_CASES } from "./twoByTwoCatalogData";

describe("twoByTwo CLL catalog data", () => {
  it("ships the full 40-case set: 6 AS + 4 H + 6 L + 6 Pi + 6 Sune + 6 T + 6 U", () => {
    expect(CLL_CASES).toHaveLength(40);
    expect(TWO_BY_TWO_COUNTS).toEqual({ cll: 40, pbl: 6, all: 46 });
    expect(CLL_GROUPS).toEqual(["AS", "H", "L", "Pi", "Sune", "T", "U"]);
    expect(PBL_GROUPS).toEqual(["Adj", "Diag"]);
    expect(TWO_BY_TWO_GROUPS_BY_SET.cll).toBe(CLL_GROUPS);
    expect(TWO_BY_TWO_GROUPS_BY_SET.pbl).toBe(PBL_GROUPS);
    expect(TWO_BY_TWO_GROUPS_BY_SET.all).toEqual([...CLL_GROUPS, ...PBL_GROUPS]);
    for (const group of CLL_GROUPS)
      expect(
        CLL_CASES.filter(row => row.group === group),
        group,
      ).toHaveLength(group === "H" ? 4 : 6);
  });

  it("ships the full 6-case PBL set: 3 Adj + 3 Diag", () => {
    expect(PBL_CASES).toHaveLength(6);
    expect(PBL_CASES.filter(row => row.group === "Adj")).toHaveLength(3);
    expect(PBL_CASES.filter(row => row.group === "Diag")).toHaveLength(3);
  });

  it("PBL case ids are unique and derived states are unique", () => {
    const ids = PBL_CASES.map(row => row.id);
    expect(new Set(ids).size).toBe(ids.length);
    const states = PBL_CASES.map(row => twoByTwoCaseStateOf(row));
    expect(new Set(states).size).toBe(states.length);
  });

  it("catalog of each family holds only its own cases", () => {
    expect(twoByTwoCatalogOf("cll")).toHaveLength(40);
    expect(twoByTwoCatalogOf("pbl")).toHaveLength(6);
    expect(twoByTwoCatalogOf("cll").every(row => row.family === "cll")).toBe(true);
    expect(twoByTwoCatalogOf("pbl").every(row => row.family === "pbl")).toBe(true);
  });

  it("has unique ids and unique derived case states across both sets", () => {
    const ids = TWO_BY_TWO_CATALOG.map(row => row.id);
    expect(new Set(ids).size).toBe(ids.length);
    const states = TWO_BY_TWO_CATALOG.map(row => twoByTwoCaseStateOf(row));
    expect(new Set(states).size).toBe(states.length);
  });

  it("every case state is a legal 24-sticker cube (4 of each colour)", () => {
    for (const row of TWO_BY_TWO_CATALOG) {
      const state = twoByTwoCaseStateOf(row);
      expect(state).toHaveLength(24);
      for (const color of "URFDLB")
        expect(state.split("").filter(c => c === color)).toHaveLength(4);
    }
  });

  it("every algorithm solves its own derived case state", () => {
    for (const row of TWO_BY_TWO_CATALOG) {
      expect(solvesTwoByTwoCase(twoByTwoCaseStateOf(row), row.algorithm), row.id).toBe(true);
    }
  });
});

describe("listTwoByTwoCases", () => {
  it("defaults to all cases (CLL then PBL) and clamps the limit", () => {
    expect(listTwoByTwoCases({ limit: 1000 })).toHaveLength(46);
    expect(listTwoByTwoCases({ limit: 3 })).toHaveLength(3);
    expect(listTwoByTwoCases({ limit: 0 })).toHaveLength(1);
  });

  it("filters by family", () => {
    expect(listTwoByTwoCases({ family: "cll", limit: 1000 })).toHaveLength(40);
    expect(listTwoByTwoCases({ family: "pbl", limit: 1000 })).toHaveLength(6);
    expect(listTwoByTwoCases({ family: "cll", query: "s", limit: 1000 })).toHaveLength(12);
  });

  it("matches case-insensitively against id and algorithm", () => {
    expect(listTwoByTwoCases({ query: "cll-as-1" }).map(row => row.id)).toEqual(["CLL-AS-1"]);
    expect(listTwoByTwoCases({ query: "pbl-diag-2" }).map(row => row.id)).toEqual(["PBL-DIAG-2"]);
    expect(listTwoByTwoCases({ query: "U R U2" }).map(row => row.id)).toContain("CLL-AS-1");
  });

  it("returns nothing for an unknown query", () => {
    expect(listTwoByTwoCases({ query: "ZZZ-NOT-A-CASE" })).toEqual([]);
  });
});

describe("twoByTwoCube invariants on the catalog", () => {
  it("alg inverse round-trips: apply(alg).then(inverse) === solved", () => {
    for (const row of TWO_BY_TWO_CATALOG) {
      const after = applyTwoByTwoMoves(TWO_BY_TWO_SOLVED, row.algorithm);
      const inverse = row.algorithm
        .split(/\s+/)
        .reverse()
        .map(m => (m.endsWith("'") ? m.slice(0, -1) : m.endsWith("2") ? m : `${m}'`))
        .join(" ");
      expect(applyTwoByTwoMoves(after, inverse), row.id).toBe(TWO_BY_TWO_SOLVED);
    }
  });
});
