// @vitest-environment node
import { describe, expect, it } from "vitest";
import { kpatternToFacelets } from "@/features/timer/lib/kpatternFacelets";
import { faceletsToPainting, paintingToFacelets } from "./faceletMap";
import { patternToPainting, type PatternData } from "./puzzleState";
import { loadStateModel } from "./stateSolve";

const SOLVED = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

async function pattern(scramble: string) {
  const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
  const kpuzzle = await puzzles["3x3x3"].kpuzzle();
  return kpuzzle.defaultPattern().applyAlg(new Alg(scramble));
}

describe("faceletMap", () => {
  it.each(["", "R", "R U R' U' F2 D L B'", "L2 D' B U2 R F' D2 L' U B2 R' F"])(
    "khớp kpatternToFacelets sau %j",
    async scramble => {
      const model = await loadStateModel("3x3x3");
      const value = await pattern(scramble);
      const facelets = kpatternToFacelets(value);
      const painting = patternToPainting(model, value.patternData as unknown as PatternData);
      expect(paintingToFacelets(model, painting, SOLVED)).toBe(facelets);
      expect(faceletsToPainting(model, facelets)).toEqual(painting);
    }
  );

  it("tô một sticker chỉ đổi đúng một ký tự, và tâm không đổi", async () => {
    const model = await loadStateModel("3x3x3");
    const painting = faceletsToPainting(model, SOLVED);
    const corner = model.stickers.find(item => item.orbit === "CORNERS")!;
    const before = paintingToFacelets(model, painting, SOLVED);
    const next = paintingToFacelets(model, { ...painting, [corner.id]: "B" }, SOLVED);
    expect([...next].filter((letter, index) => letter !== before[index])).toHaveLength(1);
    expect(next[4]).toBe("U");
  });

  it("chuỗi sai độ dài được coi như khối đã giải", async () => {
    const model = await loadStateModel("3x3x3");
    expect(paintingToFacelets(model, faceletsToPainting(model, "xx"), "xx")).toBe(SOLVED);
  });
});

describe("2×2×2 cùng quy ước góc với 3×3", () => {
  it("dữ liệu góc của pattern 2×2 bằng góc của pattern 3×3 cho cùng scramble", async () => {
    const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
    const small = await puzzles["2x2x2"].kpuzzle();
    const big = await puzzles["3x3x3"].kpuzzle();
    for (const scramble of ["R U R' F2 U'", "F R2 U' R F' U2 R'"]) {
      const a = small.defaultPattern().applyAlg(new Alg(scramble)).patternData as unknown as PatternData;
      const b = big.defaultPattern().applyAlg(new Alg(scramble)).patternData as unknown as PatternData;
      expect(a.CORNERS.pieces).toEqual(b.CORNERS.pieces);
      expect(a.CORNERS.orientation).toEqual(b.CORNERS.orientation);
    }
  });
});
