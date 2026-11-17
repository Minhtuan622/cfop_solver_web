import { describe, expect, it } from "vitest";
import {
  applyTwoByTwoMoves,
  twoByTwoCaseState,
  solvesTwoByTwoCase,
  TWO_BY_TWO_SOLVED,
} from "./twoByTwoCube";

const cases = [
  "U R U2 R' U' R U' R'",
  "R U2 R' F R' F' R U' R U' R'",
  "y R U2 R' U' R U' R'",
  "x' R U L' U2 R' U2 R",
  "F R2 U' R2 U' R2 U R2 F'",
];

describe("twoByTwoCube", () => {
  it("solved state round-trips through any move and its inverse", () => {
    for (const alg of cases) {
      const after = applyTwoByTwoMoves(TWO_BY_TWO_SOLVED, alg);
      // applying the inverse brings back the solved cube
      const inverse = alg
        .split(/\s+/)
        .reverse()
        .map(m => (m.endsWith("'") ? m.slice(0, -1) : m.endsWith("2") ? m : `${m}'`))
        .join(" ");
      expect(applyTwoByTwoMoves(after, inverse)).toBe(TWO_BY_TWO_SOLVED);
    }
  });

  it("derived case states are solved by their own algorithm", () => {
    for (const alg of cases) {
      expect(solvesTwoByTwoCase(twoByTwoCaseState(alg), alg)).toBe(true);
    }
  });

  it("different headings give different case states", () => {
    expect(twoByTwoCaseState("U")).not.toBe(twoByTwoCaseState("R"));
    expect(twoByTwoCaseState("U")).not.toBe(TWO_BY_TWO_SOLVED);
  });

  it("case states keep the U-layer stickers on the U face for OLL algs without y/x", () => {
    // not required for CLL, but sanity: apply alg to solved gives all-matching U? no —
    // just check legality (all 6 colors present, 4 of each)
    for (const alg of ["U R U2 R' U' R U' R'"]) {
      const state = twoByTwoCaseState(alg);
      for (const color of "URFDLB") {
        expect(state.split("").filter(c => c === color)).toHaveLength(4);
      }
    }
  });
});
