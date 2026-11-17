import { describe, expect, it } from "vitest";
import {
  applyTwoByTwoMoves,
  solvesTwoByTwoCase,
  TWO_BY_TWO_SOLVED,
} from "./twoByTwoCube";
import {
  TWO_BY_TWO_CATALOG,
  TWO_BY_TWO_COUNTS,
  TWO_BY_TWO_GROUPS,
  listTwoByTwoCases,
  twoByTwoCaseStateOf,
} from "./twoByTwoCatalog";
import { CLL_CASES } from "./twoByTwoCatalogData";

describe("twoByTwo CLL catalog data", () => {
  it("ships the full 40-case set: 6 AS + 4 H + 6 L + 6 Pi + 6 Sune + 6 T + 6 U", () => {
    expect(CLL_CASES).toHaveLength(40);
    expect(TWO_BY_TWO_COUNTS).toEqual({ cll: 40, all: 40 });
    expect(TWO_BY_TWO_GROUPS).toEqual(["AS", "H", "L", "Pi", "Sune", "T", "U"]);
    for (const group of TWO_BY_TWO_GROUPS)
      expect(
        CLL_CASES.filter(row => row.group === group),
        group,
      ).toHaveLength(group === "H" ? 4 : 6);
  });

  it("has unique ids and unique derived case states", () => {
    const ids = CLL_CASES.map(row => row.id);
    expect(new Set(ids).size).toBe(ids.length);
    const states = CLL_CASES.map(row => twoByTwoCaseStateOf(row));
    expect(new Set(states).size).toBe(states.length);
  });

  it("every case state is a legal 24-sticker cube (4 of each colour)", () => {
    for (const row of CLL_CASES) {
      const state = twoByTwoCaseStateOf(row);
      expect(state).toHaveLength(24);
      for (const color of "URFDLB")
        expect(state.split("").filter(c => c === color)).toHaveLength(4);
    }
  });

  it("every algorithm solves its own derived case state", () => {
    for (const row of CLL_CASES) {
      expect(solvesTwoByTwoCase(twoByTwoCaseStateOf(row), row.algorithm), row.id).toBe(true);
    }
  });
});

describe("listTwoByTwoCases", () => {
  it("lists all cases by default and clamps the limit", () => {
    expect(listTwoByTwoCases({ limit: 1000 })).toHaveLength(40);
    expect(listTwoByTwoCases({ limit: 3 })).toHaveLength(3);
    expect(listTwoByTwoCases({ limit: 0 })).toHaveLength(1);
  });

  it("matches case-insensitively against id and algorithm", () => {
    expect(listTwoByTwoCases({ query: "cll-as-1" }).map(row => row.id)).toEqual(["CLL-AS-1"]);
    expect(listTwoByTwoCases({ query: "U R U2" }).map(row => row.id)).toContain("CLL-AS-1");
  });

  it("returns nothing for an unknown query", () => {
    expect(listTwoByTwoCases({ query: "ZZZ-NOT-A-CASE" })).toEqual([]);
  });
});

describe("twoByTwoCube invariants on the catalog", () => {
  it("alg inverse round-trips: apply(alg).then(inverse) === solved", () => {
    for (const row of CLL_CASES) {
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
