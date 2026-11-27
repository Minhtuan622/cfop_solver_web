import { describe, expect, it } from "vitest";
import { MethodUnavailableError } from "./methodSolver";
import { solveWithMethod, usesMethodSolver } from "./methods";

async function check(puzzle: "222" | "pyram" | "skewb", scramble: string) {
  const phases = await solveWithMethod(puzzle, scramble, null);
  const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
  const id = { "222": "2x2x2", pyram: "pyraminx", skewb: "skewb" }[puzzle] as "2x2x2";
  const kpuzzle = await puzzles[id].kpuzzle();
  const solution = phases.flatMap(phase => phase.moves).join(" ");
  const done = kpuzzle.defaultPattern().applyAlg(new Alg(scramble)).applyAlg(new Alg(solution));
  return { phases, done, solved: kpuzzle.defaultPattern() };
}

describe("method solver", () => {
  it("knows which puzzles use a method", () => {
    expect(["222", "pyram", "skewb"].every(usesMethodSolver)).toBe(true);
    expect(usesMethodSolver("minx")).toBe(false);
  });

  it("solves a 2x2 as first layer then CLL", async () => {
    const { phases, done, solved } = await check("222", "R U2 R' F2 U R2 F' U' R F2 U2");
    expect(phases.map(phase => phase.name)).toEqual(["First Layer", "CLL"]);
    expect(done.isIdentical(solved)).toBe(true);
  }, 30_000);

  it("rejects a 2x2 whose fixed corner has moved", async () => {
    await expect(solveWithMethod("222", "D R", null)).rejects.toBeInstanceOf(MethodUnavailableError);
  });

  it("solves a pyraminx top layer, last edges, then tips", async () => {
    const { phases, done, solved } = await check("pyram", "R' L U' B R L' U B' l u' r b'");
    expect(phases.map(phase => phase.name)).toEqual(["Top Layer", "Last Edges", "Tips"]);
    expect(done.isIdentical(solved)).toBe(true);
  }, 30_000);

  it("solves a skewb as first face then last corners", async () => {
    const { phases, done } = await check("skewb", "R U' L B R' U L' B' R U");
    expect(phases.map(phase => phase.name)).toEqual(["First Face", "Last Corners"]);
    expect(done.patternData.CORNERS.pieces).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(done.patternData.CORNERS.orientation).toEqual(new Array(8).fill(0));
    expect(done.patternData.CENTERS.pieces).toEqual([0, 1, 2, 3, 4, 5]);
  }, 30_000);

  it("solves random scrambles of every method puzzle", async () => {
    let seed = 7;
    const random = (n: number) => ((seed = (seed * 1103515245 + 12345) % 2147483648), seed % n);
    const faces = { "222": ["R", "U", "F"], pyram: ["R", "L", "U", "B"], skewb: ["R", "L", "U", "B"] } as const;
    for (const puzzle of ["222", "pyram", "skewb"] as const) {
      for (let run = 0; run < 6; run += 1) {
        const scramble = Array.from({ length: 22 }, () => {
          const face = faces[puzzle][random(faces[puzzle].length)];
          return puzzle === "222" ? face + ["", "2", "'"][random(3)] : face + ["", "'"][random(2)];
        }).join(" ");
        const { done, solved } = await check(puzzle, scramble);
        if (puzzle !== "skewb") expect(done.isIdentical(solved)).toBe(true);
        else expect(done.patternData.CORNERS).toEqual(solved.patternData.CORNERS);
      }
    }
  }, 120_000);
});
