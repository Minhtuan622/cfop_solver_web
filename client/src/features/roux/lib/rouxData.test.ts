// @vitest-environment node
import { describe, expect, it } from "vitest";
import { CMLL_CASES_SOURCE, LSE_CASES_SOURCE, ROUX_COUNTS } from "./rouxData";

type PatternData = Record<string, { pieces: number[]; orientation: number[] }>;

async function after(algorithm: string, inverse: boolean) {
  const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
  const kpuzzle = await puzzles["3x3x3"].kpuzzle();
  const alg = new Alg(algorithm);
  return kpuzzle.defaultPattern().applyAlg(inverse ? alg.invert() : alg).patternData as unknown as PatternData;
}

const LSE_EDGES = new Set([0, 1, 2, 3, 4, 6]);

describe("danh mục Roux", () => {
  it("có đủ 42 case CMLL và id không trùng", () => {
    expect(CMLL_CASES_SOURCE).toHaveLength(42);
    expect(ROUX_COUNTS.all).toBe(CMLL_CASES_SOURCE.length + LSE_CASES_SOURCE.length);
    const ids = [...CMLL_CASES_SOURCE, ...LSE_CASES_SOURCE].map(row => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(CMLL_CASES_SOURCE.map(row => [row.name, row] as const))(
    "%s: chỉ đổi 4 góc U (và cạnh LSE), giữ nguyên hai khối và tâm",
    async (_name, row) => {
      const state = await after(row.algorithm, true);
      const solved = await after("", false);
      for (let slot = 4; slot < 8; slot += 1) {
        expect(state.CORNERS.pieces[slot]).toBe(solved.CORNERS.pieces[slot]);
        expect(state.CORNERS.orientation[slot]).toBe(0);
      }
      for (let slot = 0; slot < 12; slot += 1) {
        if (LSE_EDGES.has(slot)) continue;
        expect(state.EDGES.pieces[slot]).toBe(slot);
        expect(state.EDGES.orientation[slot]).toBe(0);
      }
      expect(state.CENTERS.pieces).toEqual(solved.CENTERS.pieces);
      const solvedCorners = state.CORNERS.pieces.slice(0, 4).every(
        (piece, slot) => piece === slot && state.CORNERS.orientation[slot] === 0
      );
      expect(solvedCorners).toBe(false);
    }
  );

  it("42 case CMLL phân biệt nhau (không tính AUF)", async () => {
    const seen = new Set<string>();
    for (const row of CMLL_CASES_SOURCE) {
      const state = await after(row.algorithm, true);
      const forms: string[] = [];
      for (let turn = 0; turn < 4; turn += 1) {
        const rotated = await after(`${"U ".repeat(turn)}${row.algorithm}`, true);
        forms.push(JSON.stringify([rotated.CORNERS.pieces.slice(0, 4), rotated.CORNERS.orientation.slice(0, 4)]));
      }
      void state;
      seen.add(forms.sort()[0]);
    }
    expect(seen.size).toBe(42);
  });

  it.each(LSE_CASES_SOURCE.map(row => [row.name, row] as const))(
    "%s: chỉ dùng M, E và U, không động tới góc và khối",
    async (_name, row) => {
      expect(row.algorithm.replace(/[MUE2' ()]/g, "")).toBe("");
      const state = await after(row.algorithm, true);
      const solved = await after("", false);
      for (let slot = 4; slot < 8; slot += 1) {
        expect(state.CORNERS.pieces[slot]).toBe(solved.CORNERS.pieces[slot]);
        expect(state.CORNERS.orientation[slot]).toBe(0);
      }
      for (let slot = 0; slot < 12; slot += 1) {
        if (LSE_EDGES.has(slot)) continue;
        expect(state.EDGES.pieces[slot]).toBe(slot);
      }
    }
  );
});
