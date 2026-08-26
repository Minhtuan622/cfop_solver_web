import { describe, expect, it } from "vitest";
import type { SolveHistoryEntry } from "./solveHistory";
import { wcaTimerComparison } from "./wcaTimerComparison";

function solve(id: string, elapsedMs: number, penalty: SolveHistoryEntry["penalty"] = "none"): SolveHistoryEntry {
  return { id, createdAt: Number(id.replaceAll(/\D/g, "")) || 1, elapsedMs, inspectionMs: 0, input: "R U R' U'", inputKind: "scramble", moves: 0, penalty, solution: "", note: "", tags: [], phaseSplits: [] };
}

describe("wcaTimerComparison", () => {
  it("compares the best valid Timer single and best Ao5 with the WCA 3×3 records", () => {
    const entries = [solve("s1", 13_000), solve("s2", 10_000), solve("s3", 12_000), solve("s4", 14_000), solve("s5", 11_000), solve("dnf", 8_000, "DNF")];
    expect(wcaTimerComparison(entries, { singleCentiseconds: 1_100, averageCentiseconds: 1_250 })).toEqual([
      { key: "single", label: "PB single", timerMs: 10_000, wcaMs: 11_000, deltaMs: -1_000 },
      { key: "ao5", label: "PB Ao5 / average", timerMs: 12_000, wcaMs: 12_500, deltaMs: -500 },
    ]);
  });

  it("keeps comparison unavailable when a source has no usable PB", () => {
    expect(wcaTimerComparison([solve("dnf", 8_000, "DNF")], { singleCentiseconds: null, averageCentiseconds: null })).toEqual([
      { key: "single", label: "PB single", timerMs: null, wcaMs: null, deltaMs: null },
      { key: "ao5", label: "PB Ao5 / average", timerMs: null, wcaMs: null, deltaMs: null },
    ]);
  });
});
