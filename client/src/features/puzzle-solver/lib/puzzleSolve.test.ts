import { describe, expect, it } from "vitest";
import {
  MAX_SCRAMBLE_LENGTH,
  PuzzleSolveError,
  countMoves,
  normalizeScramble,
  solveOtherPuzzle,
  type SolveEngine,
} from "./puzzleSolve";

const engine = (solution: string): SolveEngine => ({ solve: async () => solution });

describe("normalizeScramble and countMoves", () => {
  it("collapses whitespace", () => {
    expect(normalizeScramble("  R   U\n R' ")).toBe("R U R'");
  });

  it("counts one move per word", () => {
    expect(countMoves("R U' F2")).toBe(3);
    expect(countMoves("   ")).toBe(0);
  });
});

describe("solveOtherPuzzle", () => {
  it("returns the normalized scramble, the solution and its length", async () => {
    const result = await solveOtherPuzzle("222", " R  U R' ", engine("R U' R'  "));
    expect(result).toEqual({ scramble: "R U R'", solution: "R U' R'", moves: 3 });
  });

  it("passes the puzzle and the cleaned scramble to the engine", async () => {
    const calls: Array<[string, string]> = [];
    await solveOtherPuzzle("skewb", "R  L", {
      solve: async (puzzle, scramble) => {
        calls.push([puzzle, scramble]);
        return "L R";
      },
    });
    expect(calls).toEqual([["skewb", "R L"]]);
  });

  it("rejects empty and oversized scrambles before calling the engine", async () => {
    let called = false;
    const spy: SolveEngine = { solve: async () => ((called = true), "") };
    await expect(solveOtherPuzzle("222", "   ", spy)).rejects.toMatchObject({ code: "empty" });
    await expect(
      solveOtherPuzzle("222", "R ".repeat(MAX_SCRAMBLE_LENGTH), spy)
    ).rejects.toMatchObject({ code: "too-long" });
    expect(called).toBe(false);
  });

  it("classifies engine failures", async () => {
    await expect(
      solveOtherPuzzle("pyram", "Z", {
        solve: async () => {
          throw new Error("Unknown move: Z");
        },
      })
    ).rejects.toMatchObject({ code: "invalid-scramble" });
    await expect(
      solveOtherPuzzle("pyram", "R", {
        solve: async () => {
          throw new Error("worker crashed");
        },
      })
    ).rejects.toMatchObject({ code: "solver-failed" });
    await expect(
      solveOtherPuzzle("pyram", "R", {
        solve: async () => {
          throw new PuzzleSolveError("invalid-scramble");
        },
      })
    ).rejects.toBeInstanceOf(PuzzleSolveError);
  });
});
