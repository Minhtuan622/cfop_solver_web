import { describe, expect, it } from "vitest";
import { phaseTpsFromSolution, progressSeries, solutionEfficiency, splitSummary } from "./timerAnalysis";
import type { SolveHistoryEntry } from "./solveHistory";

function entry(overrides: Partial<SolveHistoryEntry> = {}): SolveHistoryEntry {
  return { id: "solve", createdAt: 1, elapsedMs: 10_000, inspectionMs: 0, input: "R U", inputKind: "scramble", moves: 0, penalty: "none", solution: "", note: "", tags: [], phaseSplits: [], eventId: "333", ...overrides };
}

describe("timerAnalysis", () => {
  it("keeps average points, split summaries and solution efficiency deterministic", () => {
    const entries = Array.from({ length: 5 }, (_, index) => entry({ id: String(index), elapsedMs: (index + 10) * 1000 }));
    expect(progressSeries(entries).at(-1)?.ao5).toBe(12_000);
    expect(splitSummary(entry({ phaseSplits: [{ phase: "Cross", markedAtMs: 1000, elapsedMs: 1000 }] }))).toBe("Cross 1.00s");
    expect(solutionEfficiency(entry({ elapsedMs: 10_000, solution: "R U R' U'" }))).toMatchObject({ moves: 4, tps: 0.4, label: "STEADY" });
  });

  it("extracts phase TPS only from valid timed solution sections", () => {
    expect(phaseTpsFromSolution("Cross: 2s R U R' U' | F2L 1: 4s R U R' U'")).toEqual([{ phase: "Cross", moves: 4, seconds: 2, tps: 2 }, { phase: "F2L", moves: 4, seconds: 4, tps: 1 }]);
  });
});
