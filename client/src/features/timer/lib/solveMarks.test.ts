import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import * as wasm from "@solver-wasm/solver_wasm.js";
import { SOLVED_FAST_STATE, applyFastMoves, stateFromScramble } from "@/lib/fastCube";
import { handleWasmRequest } from "@/lib/wasmSolverCore";
import type { SolverResult } from "@/lib/solverRuntime";
import {
  CROSS_FACES,
  deriveMarks,
  isCrossSolved,
  marksToSplits,
  normalizeState,
  solvedPairCount,
} from "./solveMarks";

beforeAll(() => {
  wasm.initSync({
    module: readFileSync(
      path.resolve(import.meta.dirname, "../../../../../packages/solver/solver-wasm/pkg/solver_wasm_bg.wasm")
    ),
  });
});

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
function scrambleOf(seed: number) {
  const random = rng(seed);
  const faces = ["U", "R", "F", "D", "L", "B"];
  const out: string[] = [];
  let last = "";
  while (out.length < 22) {
    const face = faces[Math.floor(random() * 6)];
    if (face === last) continue;
    last = face;
    out.push(face + ["", "'", "2"][Math.floor(random() * 3)]);
  }
  return out.join(" ");
}

function solve(scramble: string, crossColor: string) {
  const reply = handleWasmRequest(
    wasm,
    { id: 1, command: "solve", kind: "scramble", value: scramble, crossColor, lastLayer: "oll_pll" },
    () => undefined
  );
  if (reply.type !== undefined || !reply.ok) throw new Error("solver failed");
  return JSON.parse(reply.output!) as SolverResult;
}

describe("normalizeState", () => {
  it("khối đã giải vẫn là khối đã giải sau khi đưa mặt bất kỳ về D", () => {
    for (const face of CROSS_FACES) expect(normalizeState(SOLVED_FAST_STATE, face)).toBe(SOLVED_FAST_STATE);
  });

  it("cross đã xếp trên mặt X thì thành cross ở D sau khi chuẩn hoá", () => {
    for (const face of CROSS_FACES) {
      // Xếp sẵn cross của mặt X bằng bộ giải: khối sau bước cross.
      const scramble = scrambleOf(7);
      const result = solve(scramble, face);
      const crossPhase = result.phases.find(phase => phase.name === "cross")!;
      const state = normalizeState(crossPhase.state_after, face);
      expect(isCrossSolved(state), face).toBe(true);
    }
  });

  it("đếm đúng số cặp F2L đã xong", () => {
    expect(solvedPairCount(SOLVED_FAST_STATE)).toBe(4);
    expect(solvedPairCount(applyFastMoves(SOLVED_FAST_STATE, "R U R' U'"))).toBeLessThan(4);
  });
});

describe("deriveMarks khớp bộ giải trên mọi mặt cross", () => {
  it("nhận ra đúng mặt cross, mốc cross / cặp F2L / OLL", () => {
    let checked = 0;
    for (let seed = 1; seed <= 8; seed += 1) {
      const scramble = scrambleOf(seed);
      for (const face of CROSS_FACES) {
        const result = solve(scramble, face);
        const moves = result.trace.map(step => step.move);
        const marks = deriveMarks(scramble, moves);
        expect(marks, `${face} ${scramble}`).not.toBeNull();
        expect(marks!.face, `${face} ${scramble}`).toBe(face);
        const count = (match: (name: string) => boolean) =>
          result.phases.filter(phase => match(phase.name)).reduce((sum, phase) => sum + phase.moves.length, 0);
        const cross = count(name => name === "cross");
        const f2l = cross + count(name => name.startsWith("f2l"));
        const oll = f2l + count(name => name === "oll");
        expect(marks!.cross, `${face} ${scramble}`).toBe(cross);
        expect(marks!.pairs[3], `${face} ${scramble}`).toBe(f2l);
        expect(marks!.oll, `${face} ${scramble}`).toBe(oll);
        expect(marks!.total).toBe(moves.length);
        // Bốn cặp tăng dần và nằm giữa cross và F2L xong.
        expect(marks!.pairs[0]).toBeGreaterThanOrEqual(marks!.cross);
        for (let index = 1; index < 4; index += 1)
          expect(marks!.pairs[index]).toBeGreaterThanOrEqual(marks!.pairs[index - 1]);
        checked += 1;
      }
    }
    expect(checked).toBe(48);
  }, 240_000);

  it("không nhận ra solve không theo CFOP (chỉ vài nước ngẫu nhiên)", () => {
    expect(deriveMarks("R U R' U'", ["U", "R", "U'", "R'"])).not.toBeNull();
    expect(deriveMarks("R U R' U'", [])).toBeNull();
    expect(deriveMarks("R U R' U'", ["R", "R"])).toBeNull();
  });

  it("marksToSplits trả bốn mốc tăng dần theo thời gian", () => {
    const scramble = scrambleOf(3);
    const result = solve(scramble, "D");
    const moves = result.trace.map(step => step.move);
    const marks = deriveMarks(scramble, moves)!;
    const times = moves.map((_, index) => index * 100);
    const splits = marksToSplits(marks, times);
    expect(splits.map(split => split.phase)).toEqual(["Cross", "F2L", "OLL", "PLL"]);
    for (let index = 1; index < 4; index += 1)
      expect(splits[index].markedAtMs).toBeGreaterThanOrEqual(splits[index - 1].markedAtMs);
    expect(splits[3].markedAtMs).toBe(times.at(-1));
    expect(stateFromScramble(scramble)).toHaveLength(54);
  });
});
