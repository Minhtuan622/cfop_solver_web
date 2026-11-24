// @vitest-environment node
// Chạy cubing.js thật: kiểm chứng từng công thức Roux trên khối đã giải.
import { describe, expect, it } from "vitest";
import { CMLL_CASES_SOURCE, LSE_CASES_SOURCE, ROUX_COUNTS } from "./rouxData";

type PatternData = Record<string, { pieces: number[]; orientation: number[] }>;

async function after(algorithm: string, inverse: boolean) {
  const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
  const kpuzzle = await puzzles["3x3x3"].kpuzzle();
  const alg = new Alg(algorithm);
  return kpuzzle.defaultPattern().applyAlg(inverse ? alg.invert() : alg).patternData as unknown as PatternData;
}

/** Vị trí Reid: góc U = 0–3, góc D = 4–7; cạnh LSE = UF UR UB UL (0–3), DF (4), DB (6). */
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
      // 4 góc D (khối F2B) nguyên vẹn.
      for (let slot = 4; slot < 8; slot += 1) {
        expect(state.CORNERS.pieces[slot]).toBe(solved.CORNERS.pieces[slot]);
        expect(state.CORNERS.orientation[slot]).toBe(0);
      }
      // Cạnh của hai khối (DR, DL, FR, FL, BR, BL) nguyên vẹn.
      for (let slot = 0; slot < 12; slot += 1) {
        if (LSE_EDGES.has(slot)) continue;
        expect(state.EDGES.pieces[slot]).toBe(slot);
        expect(state.EDGES.orientation[slot]).toBe(0);
      }
      // Tâm không đổi.
      expect(state.CENTERS.pieces).toEqual(solved.CENTERS.pieces);
      // Và case thật sự cần giải: bốn góc U chưa về đúng.
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
      // Chuẩn hoá theo 4 phép xoay U của lớp trên: lấy dạng nhỏ nhất.
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
      // U xoay lớp góc trên nên chỉ so góc D (khối F2B); các góc U có thể đổi chỗ.
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
