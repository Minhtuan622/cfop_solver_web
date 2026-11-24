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
  isWholeCubeRotation,
  mergeTurns,
  stateAfter,
  type LastLayerCase,
} from "./solveAnalysis";
import { CROSS_FACES, deriveMarks, normalizeState } from "./solveMarks";

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

function recordedSolve(scramble: string, face = "D") {
  const reply = handleWasmRequest(
    wasm,
    { id: 1, command: "solve", kind: "scramble", value: scramble, crossColor: face, lastLayer: "oll_pll" },
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
        const group = result.phases
          .filter(phase => match(phase.name))
          .flatMap(phase => phase.moves)
          .filter(move => !isWholeCubeRotation(move));
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

  it("mọi mặt cross: tách bốn cặp F2L, nhận diện OLL/PLL trong khung đã chuẩn hoá", () => {
    let pairsChecked = 0;
    for (let seed = 11; seed <= 13; seed += 1) {
      const scramble = scrambleOf(seed);
      for (const face of CROSS_FACES) {
        const { result, moves, times, splits } = recordedSolve(scramble, face);
        const marks = deriveMarks(scramble, moves);
        expect(marks?.face, `${face} ${scramble}`).toBe(face);
        const analysis = analyzeSolve({ moves, moveTimes: times, phaseSplits: splits, marks })!;
        expect(analysis.face).toBe(face);
        const f2l = analysis.phases.find(item => item.phase === "F2L")!;
        expect(f2l.pairs, `${face} ${scramble}`).toHaveLength(4);
        const pairTurns = f2l.pairs!.reduce((sum, pair) => sum + pair.turns, 0);
        expect(pairTurns, `${face} ${scramble}`).toBeGreaterThanOrEqual(f2l.turns);
        expect(f2l.pairs![0].start).toBe(marks!.cross);
        expect(f2l.pairs![3].end).toBe(marks!.pairs[3]);
        const first = f2l.pairs!.find(pair => pair.turns > 0);
        if (first) expect(first.recognitionMs, `${face} ${scramble}`).toBe(700);
        for (const pair of f2l.pairs!.slice(1))
          if (pair.turns > 0 && pair !== first) expect(pair.recognitionMs).toBe(150);
        pairsChecked += f2l.pairs!.filter(pair => pair.turns > 0).length;

        const solverOll = result.phases.find(phase => phase.name === "oll");
        const solverPll = result.phases.find(phase => phase.name === "pll");
        const cases = identifySolveCases(scramble, moves, analysis, catalog, {
          oll: solverOll?.case_id ? `OLL-${solverOll.case_id}` : undefined,
          pll: solverPll?.case_id ? `PLL-${solverPll.case_id}` : undefined,
        });
        if (solverOll?.moves.length) {
          const ollCase = cases.oll;
          if (ollCase && typeof ollCase === "object") {
            expect(
              catalog.oll.some(item => item.id === ollCase.id),
              `${face} ${scramble}: ${ollCase.id}`
            ).toBe(true);
          } else {
            expect(ollCase, `${face} ${scramble}`).toBe("skip");
          }
        } else expect(cases.oll, `${face} ${scramble}`).toBe("skip");
        if (solverPll?.moves.length && solverPll.case_id)
          expect(cases.pll?.id, `${face} ${scramble}`).toBe(`PLL-${solverPll.case_id}`);
      }
    }
    expect(pairsChecked).toBeGreaterThan(40);
  }, 240_000);

  it("tách nước xoay cả khối khỏi số lượt và TPS", () => {
    expect(isWholeCubeRotation("x")).toBe(true);
    expect(isWholeCubeRotation("y'")).toBe(true);
    expect(isWholeCubeRotation("z2")).toBe(true);
    expect(isWholeCubeRotation("R")).toBe(false);
    const analysis = analyzeSolve({
      moves: ["R", "x", "R", "U"],
      moveTimes: [0, 100, 200, 300],
      phaseSplits: [
        { phase: "Cross", markedAtMs: 0, elapsedMs: 0 },
        { phase: "F2L", markedAtMs: 300, elapsedMs: 300 },
        { phase: "OLL", markedAtMs: 300, elapsedMs: 0 },
        { phase: "PLL", markedAtMs: 300, elapsedMs: 0 },
      ],
    })!;
    expect(analysis.rotations).toBe(1);
    expect(analysis.totalTurns).toBe(3);
    expect(analysis.phases.find(phase => phase.phase === "F2L")!.turns).toBe(3);
  });

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
