import { describe, expect, it } from "vitest";
import { Alg } from "cubing/alg";
import { puzzles } from "cubing/puzzles";
import { SQ1_SOLVED, applyTokens, canSlice, formatToken, parseSquareOneAlg, turnLayers } from "@/lib/squareOneModel";
import { SquareOneStateError } from "@/lib/squareOneModel";
import { solveSquareOneState, squareOneTableStats } from "./squareOneSolver";

function walk(length: number, seed: number) {
  let value = seed;
  const next = () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 2 ** 32;
  };
  const tokens: string[] = [];
  let state = SQ1_SOLVED.slice();
  while (tokens.length < length) {
    const top = Math.floor(next() * 12) - 5;
    const bottom = Math.floor(next() * 12) - 5;
    if (!canSlice(turnLayers(state, top, bottom))) continue;
    state = applyTokens(state, [{ top, bottom, slice: true }]);
    tokens.push(formatToken({ top, bottom, slice: true }));
  }
  return { text: tokens.join(" "), state };
}

const slices = (moves: string[]) => moves.filter(move => move.endsWith("/")).length;

describe("square-one solver tables", () => {
  it("reach every shape and every permutation of the last phase", () => {
    const stats = squareOneTableStats();
    expect(stats.shapeStates).toBe(19305);
    expect(stats.maxShape).toBe(7);
    // 4!^4 arrangements of corners and edges inside their layers, times the
    // slice parity: the parity runs make all of them reachable.
    expect(stats.layerStates).toBe(stats.layerStatesTotal);
    expect(stats.parityMacros).toBeGreaterThan(0);
  });
});

describe("square-one solver", () => {
  it("returns no moves for a solved puzzle", () => {
    const phases = solveSquareOneState(SQ1_SOLVED.slice());
    expect(phases.flatMap(phase => phase.moves)).toEqual([]);
  });

  it("solves an arrangement that only needs a layer turn", () => {
    const state = turnLayers(SQ1_SOLVED, 3, -6);
    const phases = solveSquareOneState(state);
    const solution = phases.flatMap(phase => phase.moves).join(" ");
    expect(slices(solution.split(" "))).toBe(0);
    expect(applyTokens(state, parseSquareOneAlg(solution))).toEqual(SQ1_SOLVED);
  });

  it("solves random scrambles in three phases, checked against cubing", async () => {
    const kpuzzle = await puzzles.square1.kpuzzle();
    const solved = JSON.stringify(kpuzzle.defaultPattern().patternData);
    let total = 0;
    for (let index = 0; index < 12; index += 1) {
      const { text, state } = walk(14 + index * 3, 1000 + index);
      const pattern = kpuzzle.defaultPattern().applyAlg(new Alg(text));
      const data = pattern.patternData as unknown as { EQUATOR: { orientation: number[] } };
      const phases = solveSquareOneState(state, { equatorFlipped: data.EQUATOR.orientation[1] !== 0 });
      expect(phases.map(phase => phase.name)).toEqual(["Cube Shape", "Separate Layers", "Permute"]);
      const solution = phases.flatMap(phase => phase.moves).join(" ");
      expect(JSON.stringify(pattern.applyAlg(new Alg(solution)).patternData)).toBe(solved);
      total += slices(solution.split(" "));
    }
    expect(total / 12).toBeLessThan(34);
  });

  it("needs an odd number of slices when the middle layer is flipped", () => {
    const { state } = walk(20, 42);
    const even = solveSquareOneState(state, { equatorFlipped: false }).flatMap(phase => phase.moves);
    const odd = solveSquareOneState(state, { equatorFlipped: true }).flatMap(phase => phase.moves);
    expect(slices(even) % 2).toBe(0);
    expect(slices(odd) % 2).toBe(1);
  });

  it("rejects an arrangement that is not a Square-1", () => {
    const broken = SQ1_SOLVED.slice();
    [broken[0], broken[2]] = [broken[2], broken[0]];
    expect(() => solveSquareOneState(broken)).toThrow(SquareOneStateError);
  });
});
