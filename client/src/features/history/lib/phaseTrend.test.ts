import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import * as wasm from "@solver-wasm/solver_wasm.js";
import { handleWasmRequest } from "@/lib/wasmSolverCore";
import type { SolverResult } from "@/lib/solverRuntime";
import type { SolveHistoryEntry } from "@/lib/solveHistory";
import { PHASE_TREND_SOLVES, phaseTrend } from "./phaseTrend";

beforeAll(() => {
  wasm.initSync({
    module: readFileSync(
      path.resolve(
        import.meta.dirname,
        "../../../../../packages/solver/solver-wasm/pkg/solver_wasm_bg.wasm"
      )
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

function entryOf(seed: number, overrides: Partial<SolveHistoryEntry> = {}): SolveHistoryEntry {
  const input = scrambleOf(seed);
  const result = solve(input, "D");
  const moves = result.trace.map(step => step.move);
  return {
    id: String(seed),
    createdAt: seed,
    elapsedMs: moves.length * 100,
    inspectionMs: 0,
    input,
    inputKind: "scramble",
    moves: moves.length,
    penalty: "none",
    solution: moves.join(" "),
    moveTimes: moves.map((_, index) => index * 100),
    note: "",
    tags: [],
    phaseSplits: [],
    eventId: "333",
    source: "smartcube",
    ...overrides,
  };
}

describe("phaseTrend", () => {
  it("chỉ lấy solve 3×3 có nhịp, tách đúng cột giai đoạn", () => {
    const rows = phaseTrend([
      entryOf(5),
      entryOf(6, { moveTimes: undefined }),
      entryOf(7, { eventId: "222" }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].crossExecution).not.toBeNull();
    expect(rows[0].f2lExecution).not.toBeNull();
    expect(rows[0].ollExecution).not.toBeNull();
    expect(rows[0].pllExecution).not.toBeNull();
    expect(rows[0].f2lExecution!).toBeGreaterThan(0);
  }, 120_000);

  it("giữ thứ tự cũ đến mới và giới hạn số solve", () => {
    const base = entryOf(5);
    const rows = phaseTrend(
      Array.from({ length: PHASE_TREND_SOLVES + 5 }, (_, index) => ({
        ...base,
        id: String(index),
        createdAt: index,
      }))
    );
    expect(rows).toHaveLength(PHASE_TREND_SOLVES);
    expect(rows[0].solve).toBe(1);
    expect(rows.at(-1)!.solve).toBe(PHASE_TREND_SOLVES);
  }, 60_000);
});
