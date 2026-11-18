import { describe, expect, it } from "vitest";
import { FIVE_BY_FIVE_L2E_CASES } from "./l2eData";
import { fiveByFiveL2EScrambleOf, toCubingNotation } from "./l2eAlg";
import { L2E_CATALOG, listFiveByFiveL2ECases } from "./l2eCatalog";

describe("5×5 L2E catalog data", () => {
  it("contains exactly the 15 canonical cases", () => {
    expect(FIVE_BY_FIVE_L2E_CASES).toHaveLength(15);
    expect(new Set(FIVE_BY_FIVE_L2E_CASES.map(row => row.id)).size).toBe(15);
    expect(FIVE_BY_FIVE_L2E_CASES.map(row => row.id)).toEqual([
      "L2E-1", "L2E-2", "L2E-3", "L2E-4", "L2E-5", "L2E-6", "L2E-7",
      "L2E-8", "L2E-9", "L2E-10", "L2E-11", "L2E-12", "L2E-13",
      "NO-L5", "NO-L6",
    ]);
  });

  it("keeps every algorithm free of grouping parentheses and empty", () => {
    for (const row of FIVE_BY_FIVE_L2E_CASES) {
      expect(row.algorithm).not.toMatch(/[()]/);
      expect(row.algorithm.trim().length).toBeGreaterThan(0);
      expect(row.group).toBe("L2E");
      expect(row.family).toBe("l2e");
    }
  });

  it("builds catalog rows with the sentinel state", () => {
    expect(L2E_CATALOG).toHaveLength(15);
    expect(L2E_CATALOG.every(row => row.state === `l2e:${row.id}`)).toBe(true);
    expect(listFiveByFiveL2ECases({ query: "Rw2 F2" }).length).toBeGreaterThan(0);
    expect(listFiveByFiveL2ECases({ query: "no such move" })).toHaveLength(0);
    expect(listFiveByFiveL2ECases({ limit: 3 })).toHaveLength(3);
  });

  it("inverts each algorithm into an inverse of the same length", () => {
    for (const row of FIVE_BY_FIVE_L2E_CASES) {
      const tokens = toCubingNotation(row.algorithm).split(" ");
      const scramble = fiveByFiveL2EScrambleOf(row.algorithm);
      expect(scramble.split(" ")).toHaveLength(tokens.length);
      // a ∘ a⁻¹ round trip must restore the solvable state token-wise
      expect([...tokens].reverse().length).toBe(tokens.length);
      expect(scramble).toBe([...tokens].reverse().map(token =>
        token.endsWith("2") ? token : token.endsWith("'") ? token.slice(0, -1) : `${token}'`,
      ).join(" "));
    }
    // The self-inverse palindrome case stays stable.
    expect(fiveByFiveL2EScrambleOf("Rw2 F2 U2 Rw2 U2 F2 Rw2")).toBe(
      "Rw2 F2 U2 Rw2 U2 F2 Rw2",
    );
  });
});
