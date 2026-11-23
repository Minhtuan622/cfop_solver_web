import { describe, expect, it } from "vitest";
import {
  compareWithOptimal,
  countFaceMoves,
  invertAlgorithm,
  type OptimalEngine,
} from "./optimalSolve";

describe("invertAlgorithm", () => {
  it("reverses the order and flips every turn", () => {
    expect(invertAlgorithm("R U R' U' F2")).toBe("F2 U R U' R'");
  });

  it("is its own inverse", () => {
    const alg = "x R U' L2 Rw D'";
    expect(invertAlgorithm(invertAlgorithm(alg))).toBe(alg);
  });

  it("tolerates extra whitespace and an empty algorithm", () => {
    expect(invertAlgorithm("  R   U ")).toBe("U' R'");
    expect(invertAlgorithm("")).toBe("");
  });
});

describe("countFaceMoves", () => {
  it("does not count whole-cube rotations", () => {
    expect(countFaceMoves("x2 R U y' R' z")).toBe(3);
    expect(countFaceMoves("")).toBe(0);
  });
});

describe("compareWithOptimal", () => {
  it("builds the setup from the inverted CFOP solution and compares lengths", async () => {
    const seen: string[] = [];
    const engine: OptimalEngine = {
      solveFromSetup: async setup => {
        seen.push(setup);
        return "R U' F";
      },
    };
    const result = await compareWithOptimal("F' U R U' R' F2", engine);
    expect(seen).toEqual(["F2 R U R' U' F"]);
    expect(result).toEqual({
      solution: "R U' F",
      moves: 3,
      cfopMoves: 6,
      extraMoves: 3,
    });
  });

  it("rejects an empty solution and wraps engine failures", async () => {
    const engine: OptimalEngine = { solveFromSetup: async () => "R" };
    await expect(compareWithOptimal("  ", engine)).rejects.toMatchObject({ code: "empty" });
    await expect(
      compareWithOptimal("R", {
        solveFromSetup: async () => {
          throw new Error("worker crashed");
        },
      })
    ).rejects.toMatchObject({ code: "solver-failed" });
  });
});
