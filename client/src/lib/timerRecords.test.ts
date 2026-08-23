import { describe, expect, it } from "vitest";
import type { SolveHistoryEntry } from "./solveHistory";
import { detectPersonalRecords } from "./timerRecords";

function solve(id: string, elapsedMs: number, penalty: SolveHistoryEntry["penalty"] = "none"): SolveHistoryEntry {
  return { id, createdAt: Number(id.replaceAll(/\D/g, "")) || 1, elapsedMs, inspectionMs: 0, input: "R U R' U'", inputKind: "scramble", moves: 0, penalty, solution: "", note: "", tags: [], phaseSplits: [] };
}

describe("detectPersonalRecords", () => {
  it("marks a faster valid single as a PB", () => {
    expect(detectPersonalRecords([solve("old", 15_000)], solve("new", 12_000))).toEqual([{ key: "single", value: 12_000 }]);
  });

  it("marks a new Ao5 only when the completed window beats the earlier best", () => {
    const previous = [solve("s1", 20_000), solve("s2", 21_000), solve("s3", 22_000), solve("s4", 23_000), solve("s5", 24_000)];
    expect(detectPersonalRecords(previous, solve("candidate", 19_000))).toEqual(expect.arrayContaining([{ key: "ao5", value: 21_000 }]));
  });

  it("never awards a record to a DNF", () => {
    expect(detectPersonalRecords([solve("old", 15_000)], solve("dnf", 8_000, "DNF"))).toEqual([]);
  });
});
