/**
 * Bảng nước đi của `fastCube.ts` (xem trước scramble ngay trong trang) phải
 * khớp từng sticker với bộ giải thật (`packages/solver`, bản build
 * WebAssembly), cho mọi loại nước: mặt, slice, xoay cả khối và wide.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import * as wasm from "@solver-wasm/solver_wasm.js";
import { SOLVED_FAST_STATE, stateFromScramble } from "@/lib/fastCube";

beforeAll(() => {
  const file = path.resolve(
    import.meta.dirname,
    "../../../packages/solver/solver-wasm/pkg/solver_wasm_bg.wasm"
  );
  wasm.initSync({ module: readFileSync(file) });
});

const FAMILIES = "U R F D L B M E S x y z u r f d l b".split(" ");
const SUFFIXES = ["", "'", "2"];

/** SplitMix64 rút gọn về 32 bit: đề ngẫu nhiên nhưng cố định. */
function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x9e3779b9) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
    return ((z ^ (z >>> 16)) >>> 0) / 2 ** 32;
  };
}

describe("fastCube khớp với bộ giải", () => {
  it("từng nước đơn lẻ", () => {
    for (const family of FAMILIES) {
      for (const suffix of SUFFIXES) {
        const move = family + suffix;
        expect(stateFromScramble(move), move).toBe(wasm.scrambleToStickers(move));
      }
    }
    expect(wasm.scrambleToStickers("")).toBe(SOLVED_FAST_STATE);
  });

  it("300 chuỗi ngẫu nhiên trộn mọi loại nước", () => {
    const next = rng(20261121);
    for (let i = 0; i < 300; i++) {
      const moves = Array.from({ length: 30 }, () => {
        const family = FAMILIES[Math.floor(next() * FAMILIES.length)];
        return family + SUFFIXES[Math.floor(next() * SUFFIXES.length)];
      }).join(" ");
      expect(stateFromScramble(moves), moves).toBe(wasm.scrambleToStickers(moves));
    }
  });

  it("cách viết Rw/Dw giống nhau ở cả hai phía", () => {
    const scramble = "D' R2 U Dw Rw2 F'";
    expect(stateFromScramble(scramble)).toBe(wasm.scrambleToStickers(scramble));
  });
});
