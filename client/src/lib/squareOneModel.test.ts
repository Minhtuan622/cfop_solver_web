import { describe, expect, it } from "vitest";
import { Alg } from "cubing/alg";
import { puzzles } from "cubing/puzzles";
import {
  SQ1_SOLVED,
  SquareOneStateError,
  applyTokens,
  assertSquareOneState,
  canSlice,
  formatToken,
  isSquareOneAlgorithm,
  normalizeTurn,
  parseSquareOneAlg,
  piecesOf,
  turnLayers,
  wedgeKind,
} from "./squareOneModel";

// Scrambles from cubing's WCA generator for event sq1, kept as fixtures.
const OFFICIAL = [
  "(1, 0) / (2, 5) / (-3, -3) / (3, 0) / (-5, 4) / (-1, 0) / (-3, 0) / (4, 0) / (5, 0) / (2, 0) / (-2, -1) / (-2, 0) / (-4, 0)",
  "(0, -4) / (3, -3) / (0, 3) / (-2, 1) / (0, -3) / (6, 0) / (-4, 0) / (3, 3) / (5, 0) / (0, 2) / (-4, 0) / (0, 2) / (5, 0) / (0, 3)",
  "(3, -1) / (1, -2) / (0, -3) / (0, -3) / (-4, -1) / (-3, -3) / (0, -2) / (-3, 0) / (4, -1) / (-4, 0) / (6, 0)",
];

function randomWalk(length: number, seed: number) {
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

describe("square-one model", () => {
  it("classifies wedges so the top reads corner, corner, edge and the bottom edge, corner, corner", () => {
    const top = SQ1_SOLVED.slice(0, 12).map(wedgeKind);
    const bottom = SQ1_SOLVED.slice(12).map(wedgeKind);
    expect(top).toEqual([0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2]);
    expect(bottom).toEqual([2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1]);
  });

  it("lists eight edges and eight corners", () => {
    const pieces = piecesOf(SQ1_SOLVED);
    expect(pieces.filter(piece => piece.kind === "edge")).toHaveLength(8);
    expect(pieces.filter(piece => piece.kind === "corner")).toHaveLength(8);
  });

  it("parses and formats turns and slices", () => {
    const tokens = parseSquareOneAlg("(1, -2) / (3,0)/ /  (0,-3)");
    expect(tokens).toEqual([
      { top: 1, bottom: -2, slice: true },
      { top: 3, bottom: 0, slice: true },
      { top: 0, bottom: 0, slice: true },
      { top: 0, bottom: -3, slice: false },
    ]);
    expect(tokens.map(formatToken).join(" ")).toBe("(1,-2)/ (3,0)/ (0,0)/ (0,-3)");
    expect(isSquareOneAlgorithm("R U R'")).toBe(false);
    expect(isSquareOneAlgorithm("")).toBe(true);
  });

  it("normalizes turns to -5..6", () => {
    expect([-7, -6, 0, 6, 7, 12].map(normalizeTurn)).toEqual([5, 6, 0, 6, -5, 0]);
  });

  it("accepts every official scramble and rejects a slice through a corner", () => {
    for (const scramble of OFFICIAL) {
      const state = applyTokens(SQ1_SOLVED, parseSquareOneAlg(scramble));
      expect(() => assertSquareOneState(state)).not.toThrow();
    }
    // A single quarter turn of the top layer puts a corner across the cut.
    expect(() => applyTokens(SQ1_SOLVED, parseSquareOneAlg("(2,0)/"))).toThrow(SquareOneStateError);
  });

  it("rejects arrangements that split a corner", () => {
    const broken = SQ1_SOLVED.slice();
    [broken[0], broken[2]] = [broken[2], broken[0]];
    expect(() => assertSquareOneState(broken)).toThrow(SquareOneStateError);
    expect(() => assertSquareOneState(SQ1_SOLVED.slice(0, 23))).toThrow(SquareOneStateError);
  });

  it("matches cubing's square1 kpuzzle on scrambles", async () => {
    const kpuzzle = await puzzles.square1.kpuzzle();
    for (const text of [...OFFICIAL, randomWalk(30, 7).text, randomWalk(40, 99).text]) {
      const pattern = kpuzzle.defaultPattern().applyAlg(new Alg(text)).patternData as unknown as {
        WEDGES: { pieces: number[] };
      };
      expect(applyTokens(SQ1_SOLVED, parseSquareOneAlg(text))).toEqual(pattern.WEDGES.pieces);
    }
  });
});
