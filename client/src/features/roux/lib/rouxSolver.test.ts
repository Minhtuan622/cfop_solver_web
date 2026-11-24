// @vitest-environment node
// Chạy cubing.js thật: giải Roux từ scramble và kiểm khối về đúng trạng thái đã giải.
import { beforeAll, describe, expect, it } from "vitest";
import {
  applyAlgorithm,
  createRouxSolver,
  isSolved,
  solveRoux,
  solvedState,
  stateFromPatternData,
  type QuarterMoves,
  type RouxSolverContext,
} from "./rouxSolver";

let context: RouxSolverContext;
let kpuzzleDefinition: { moves: QuarterMoves };

async function scrambled(scramble: string) {
  const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
  const kpuzzle = await puzzles["3x3x3"].kpuzzle();
  const pattern = kpuzzle.defaultPattern().applyAlg(new Alg(scramble));
  return stateFromPatternData(pattern.patternData as never);
}

beforeAll(async () => {
  const { puzzles } = await import("cubing/puzzles");
  const kpuzzle = await puzzles["3x3x3"].kpuzzle();
  kpuzzleDefinition = kpuzzle.definition as never;
  const names = ["U", "D", "L", "R", "F", "B", "M", "r"];
  context = createRouxSolver(Object.fromEntries(names.map(name => [name, kpuzzleDefinition.moves[name]])) as QuarterMoves);
}, 180_000);

describe("bộ giải Roux", () => {
  it("khối đã giải không cần lượt nào", () => {
    const result = solveRoux(context, solvedState());
    expect(result.moves).toEqual([]);
  });

  it.each([
    "R U R' U'",
    "R U R' F2 D L B'",
    "L2 D' B U2 R F' D2 L' U B2 R' F",
    "F' R B' L2 U2 R' D B2 U' F2 L D2 R U' B L'",
    "D2 B' L2 F R2 U2 F' U2 R2 B2 U' L' F2 D' R B D L U' R2",
  ])("giải %j và lời giải đưa khối về đã giải", async scramble => {
    const start = await scrambled(scramble);
    const started = Date.now();
    const result = solveRoux(context, start);
    const final = applyAlgorithm(start, context.tables, result.moves.join(" "));
    expect(isSolved(final)).toBe(true);
    expect(result.phases.map(phase => phase.name)).toEqual(["First Block", "Second Block", "CMLL", "LSE"]);
    // Khối đầu tiên và khối thứ hai nằm gọn trong giới hạn của người giải thật.
    expect(result.phases[0].moves.length).toBeLessThanOrEqual(11);
    expect(Date.now() - started).toBeLessThan(20_000);
  }, 120_000);

  it("giải 25 scramble ngẫu nhiên đều ra khối đã giải", async () => {
    const { randomScrambleForEvent } = await import("cubing/scramble");
    const lengths: number[] = [];
    for (let i = 0; i < 25; i += 1) {
      const scramble = (await randomScrambleForEvent("333")).toString();
      const start = await scrambled(scramble);
      const result = solveRoux(context, start);
      expect(isSolved(applyAlgorithm(start, context.tables, result.moves.join(" ")))).toBe(true);
      lengths.push(result.moves.length);
    }
    const mean = lengths.reduce((sum, value) => sum + value, 0) / lengths.length;
    console.log("Roux mean moves:", mean.toFixed(1), "max", Math.max(...lengths));
    expect(mean).toBeLessThan(70);
  }, 600_000);
});
