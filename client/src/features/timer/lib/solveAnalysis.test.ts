import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import * as wasm from "@solver-wasm/solver_wasm.js";
import { CFOP_CATALOG } from "@/features/cfop/lib/cfopCatalog";
import { handleWasmRequest } from "@/lib/wasmSolverCore";
import type { SolverResult } from "@/lib/solverRuntime";
import type { SolvePhaseSplit, SplitPhase } from "@/lib/solveHistory";
import { applyFastMoves } from "@/lib/fastCube";
import {
  analyzeSolve,
  identifySolveCases,
  isOrientedLastLayer,
  mergeTurns,
  stateAfter,
  type LastLayerCase,
} from "./solveAnalysis";

beforeAll(() => {
  wasm.initSync({
    module: readFileSync(
      path.resolve(import.meta.dirname, "../../../../../packages/solver/solver-wasm/pkg/solver_wasm_bg.wasm")
    ),
  });
});

const catalog = {
  oll: CFOP_CATALOG.filter(item => item.family === "oll") as LastLayerCase[],
  pll: CFOP_CATALOG.filter(item => item.family === "pll") as LastLayerCase[],
};

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

function recordedSolve(scramble: string) {
  const reply = handleWasmRequest(
    wasm,
    { id: 1, command: "solve", kind: "scramble", value: scramble, crossColor: "D", lastLayer: "oll_pll" },
    () => undefined
  );
  if (reply.type !== undefined || !reply.ok) throw new Error("solver failed");
  const result = JSON.parse(reply.output!) as SolverResult;
  const moves: string[] = [];
  const times: number[] = [];
  const marks: Record<SplitPhase, number> = { Cross: 0, F2L: 0, OLL: 0, PLL: 0 };
  let clock = 0;
  const phaseOf = (name: string): SplitPhase =>
    name === "cross" ? "Cross" : name.startsWith("f2l") ? "F2L" : name === "oll" ? "OLL" : "PLL";
  const pauseBefore = new Set<SplitPhase>(["F2L", "OLL", "PLL"]);
  const seen = new Set<SplitPhase>();
  for (const phase of result.phases) {
    const group = phaseOf(phase.name);
    for (const [index, move] of phase.moves.entries()) {
      clock += index === 0 && !seen.has(group) && pauseBefore.has(group) ? 700 : 150;
      moves.push(move);
      times.push(clock);
      marks[group] = clock;
    }
    seen.add(group);
  }
  const offset = times[0] ?? 0;
  const rebased = times.map(value => value - offset);
  const splits: SolvePhaseSplit[] = (["Cross", "F2L", "OLL", "PLL"] as const).map(phase => ({
    phase,
    markedAtMs: marks[phase] ? marks[phase] - offset : 0,
    elapsedMs: 0,
  }));
  return { result, moves, times: rebased, splits };
}

describe("mergeTurns", () => {
  it("gộp các nước 90° liền nhau trên cùng một mặt", () => {
    expect(mergeTurns(["R", "R", "U"], [0, 100, 200]).map(item => item.move)).toEqual(["R2", "U"]);
    expect(mergeTurns(["R", "R'", "U"], [0, 100, 200]).map(item => item.move)).toEqual(["U"]);
    expect(mergeTurns(["R2", "R"], [0, 1]).map(item => item.move)).toEqual(["R'"]);
    expect(mergeTurns(["R2", "R", "R"], [0, 1, 2])).toEqual([]);
    expect(mergeTurns(["R", "U", "R"], [0, 1, 2]).map(item => item.move)).toEqual(["R", "U", "R"]);
  });

  it("giữ chỉ số nước thô của cụm", () => {
    const merged = mergeTurns(["U", "R", "R"], [0, 10, 20]);
    expect(merged[1]).toMatchObject({ move: "R2", from: 1, to: 3, at: 20 });
  });
});

describe("analyzeSolve với lời giải của bộ giải", () => {
  it("tách giai đoạn khớp bộ giải, nhận diện/thực hiện và case OLL/PLL", () => {
    let comparedCases = 0;
    for (let seed = 1; seed <= 20; seed += 1) {
      const scramble = scrambleOf(seed);
      const { result, moves, times, splits } = recordedSolve(scramble);
      const analysis = analyzeSolve({ moves, moveTimes: times, phaseSplits: splits });
      expect(analysis, scramble).not.toBeNull();
      const byPhase = (name: SplitPhase) => analysis!.phases.find(item => item.phase === name)!;

      const solverCount = (match: (name: string) => boolean) => {
        const group = result.phases.filter(phase => match(phase.name)).flatMap(phase => phase.moves);
        return mergeTurns(group, group.map((_, index) => index)).length;
      };
      expect(byPhase("Cross").turns, scramble).toBe(solverCount(name => name === "cross"));
      expect(byPhase("F2L").turns, scramble).toBe(solverCount(name => name.startsWith("f2l")));
      expect(byPhase("OLL").turns, scramble).toBe(solverCount(name => name === "oll"));
      expect(byPhase("PLL").turns, scramble).toBe(solverCount(name => name === "pll"));

      for (const name of ["F2L", "OLL", "PLL"] as const) {
        const phase = byPhase(name);
        if (phase.turns) expect(phase.recognitionMs, `${scramble} ${name}`).toBe(700);
      }

      const cases = identifySolveCases(scramble, moves, analysis!, catalog);
      const solverOll = result.phases.find(phase => phase.name === "oll");
      const solverPll = result.phases.find(phase => phase.name === "pll");
      if (solverOll?.moves.length && typeof cases.oll === "object" && cases.oll) {
        comparedCases += 1;
        const found = catalog.oll.find(item => item.id === cases.oll.id)!;
        const state = stateAfter(scramble, moves, byPhase("F2L").end);
        const aligned = applyFastMoves(state, ["", "U", "U2", "U'"][cases.oll.auf]);
        expect(isOrientedLastLayer(applyFastMoves(aligned, found.algorithm!)), scramble).toBe(true);
      }
      if (solverPll?.moves.length && solverPll.case_id && typeof cases.pll === "object" && cases.pll) {
        comparedCases += 1;
        expect(cases.pll.id, scramble).toBe(`PLL-${solverPll.case_id}`);
      }
      if (!solverOll?.moves.length) expect(cases.oll, scramble).toBe("skip");
    }
    expect(comparedCases).toBeGreaterThan(10);
  }, 120_000);

  it("báo quãng dừng dài nhất theo giai đoạn", () => {
    const analysis = analyzeSolve({
      moves: ["R", "U", "R'", "U'"],
      moveTimes: [0, 100, 1600, 1700],
      phaseSplits: [
        { phase: "Cross", markedAtMs: 100, elapsedMs: 100 },
        { phase: "F2L", markedAtMs: 1700, elapsedMs: 1600 },
        { phase: "OLL", markedAtMs: 1700, elapsedMs: 0 },
        { phase: "PLL", markedAtMs: 1700, elapsedMs: 0 },
      ],
    });
    expect(analysis?.pauses[0]).toMatchObject({ moveIndex: 2, gapMs: 1500, phase: "F2L" });
  });

  it("trả null khi thiếu hoặc lệch dữ liệu", () => {
    expect(analyzeSolve({ moves: [], moveTimes: [], phaseSplits: [] })).toBeNull();
    expect(analyzeSolve({ moves: ["R"], moveTimes: [], phaseSplits: [] })).toBeNull();
  });
});
