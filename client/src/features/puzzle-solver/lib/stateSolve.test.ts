// @vitest-environment node
// Chạy cubing.js thật (không mock): quy ước hướng sticker phải khớp các lượt quay.
import { describe, expect, it } from "vitest";
import {
  colorCountsMatch,
  paintingToPatternData,
  patternToPainting,
  solvedPainting,
  type KPuzzleId,
  type PatternData,
} from "./puzzleState";
import { loadStateModel, solveFromPainting } from "./stateSolve";
import type { OtherPuzzleId } from "./puzzleSolve";

const CASES: Array<[OtherPuzzleId, KPuzzleId, string]> = [
  ["222", "2x2x2", "R U R' U' F2 R"],
  ["pyram", "pyraminx", "R U L' B' u l'"],
  ["skewb", "skewb", "R L' B R' L D"],
  ["333fm", "3x3x3", "R U R' F2 D L B' U2 R"],
  ["minx", "megaminx", "R++ D-- R-- D++ U R++ D-- U'"],
];

async function scrambled(kpuzzleId: KPuzzleId, scramble: string) {
  const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
  const kpuzzle = await puzzles[kpuzzleId].kpuzzle();
  return kpuzzle.defaultPattern().applyAlg(new Alg(scramble));
}

describe.each(CASES)("trạng thái tô màu của %s", (id, kpuzzleId, scramble) => {
  it("khối đã giải ứng với pattern đã giải", async () => {
    const model = await loadStateModel(kpuzzleId);
    const solved = (await scrambled(kpuzzleId, "")).patternData as unknown as PatternData;
    expect(patternToPainting(model, solved)).toEqual(solvedPainting(model));
  });

  it("pattern → màu → pattern giữ nguyên (trừ hướng tâm)", async () => {
    const model = await loadStateModel(kpuzzleId);
    const pattern = await scrambled(kpuzzleId, scramble);
    const painting = patternToPainting(model, pattern.patternData as unknown as PatternData);
    expect(colorCountsMatch(model, painting)).toBe(true);
    const back = paintingToPatternData(model, painting);
    expect(back.ok).toBe(true);
    if (!back.ok) return;
    const original = pattern.patternData as unknown as PatternData;
    for (const orbit of model.orbits) {
      expect(back.data[orbit.name].pieces).toEqual(original[orbit.name].pieces);
      // Mảnh mà mọi sticker cùng màu (tâm) không có hướng nhìn thấy được.
      const visible = model.stickers
        .filter(item => item.orbit === orbit.name && item.slot === 0)
        .some(item => item.face !== model.stickers.find(other => other.orbit === orbit.name && other.slot === 0)!.face);
      if (visible) expect(back.data[orbit.name].orientation).toEqual(original[orbit.name].orientation);
    }
  });

  it("giải được từ trạng thái tô màu và lời giải thật sự đưa về đã giải", async () => {
    const model = await loadStateModel(kpuzzleId);
    const pattern = await scrambled(kpuzzleId, scramble);
    const painting = patternToPainting(model, pattern.patternData as unknown as PatternData);
    const result = await solveFromPainting(id, painting);
    expect(result.solution.length).toBeGreaterThan(0);
    // setup là nghịch đảo của lời giải: áp lên khối đã giải ra lại đúng trạng thái.
    const rebuilt = await scrambled(kpuzzleId, result.setup);
    expect(
      patternToPainting(model, rebuilt.patternData as unknown as PatternData)
    ).toEqual(
      expect.objectContaining(
        Object.fromEntries(
          Object.entries(painting).filter(([key]) => !key.startsWith("CENTERS"))
        )
      )
    );
  }, 120_000);

  it("từ chối trạng thái sai (đổi màu hai sticker của hai mảnh khác nhau)", async () => {
    const model = await loadStateModel(kpuzzleId);
    const painting = { ...solvedPainting(model) };
    const [first, second] = model.stickers.filter(item => item.face !== model.stickers[0].face);
    painting[model.stickers[0].id] = first.face;
    painting[second.id] = model.stickers[0].face;
    painting[first.id] = first.face; // giữ đủ số màu nhưng ghép sai mảnh
    await expect(solveFromPainting(id, painting)).rejects.toMatchObject({ code: "invalid-state" });
  }, 120_000);
});
