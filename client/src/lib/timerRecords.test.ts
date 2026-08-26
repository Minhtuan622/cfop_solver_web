import { describe, expect, it } from "vitest";
import type { SolveHistoryEntry } from "./solveHistory";
import { detectPersonalRecords, metricEvidence } from "./timerRecords";

function solve(id: string, elapsedMs: number, penalty: SolveHistoryEntry["penalty"] = "none"): SolveHistoryEntry {
  return { id, createdAt: Number(id.replaceAll(/\D/g, "")) || 1, elapsedMs, inspectionMs: 0, input: "R U R' U'", inputKind: "scramble", moves: 0, penalty, solution: "", note: "", tags: [], phaseSplits: [] };
}

function multiBlind(id: string, attempted: number, solved: number, elapsedMs: number): SolveHistoryEntry {
  return { ...solve(id, elapsedMs), eventId: "333mbf", multiBlind: { attempted, solved } };
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

  it("maps PB and Ao5 drill-downs back to their concrete solve rows", () => {
    const entries = [solve("s1", 13_000), solve("s2", 10_000), solve("s3", 12_000), solve("s4", 14_000), solve("s5", 11_000)];
    expect(metricEvidence(entries, "pb").entries.map((entry) => entry.id)).toEqual(["s2"]);
    expect(metricEvidence(entries, "ao5")).toMatchObject({ value: 12_000, entries: entries });
  });

  it("marks the discarded best and worst solve for valid and one-DNF averages", () => {
    const valid = [solve("a", 13_000), solve("b", 10_000), solve("c", 12_000), solve("d", 14_000), solve("e", 11_000)];
    const withDnf = [solve("a", 13_000), solve("b", 10_000), solve("c", 12_000), solve("d", 14_000), solve("dnf", 0, "DNF")];
    expect(metricEvidence(valid, "ao5").exclusions).toEqual({ b: "best", d: "worst" });
    expect(metricEvidence(withDnf, "ao5").exclusions).toEqual({ b: "best", dnf: "worst" });
  });

  it("ranks Multi-Blind PB by score, then time, then unsolved cubes", () => {
    const previous = [multiBlind("old", 4, 3, 40_000)];
    const candidate = multiBlind("new", 6, 4, 30_000);
    expect(detectPersonalRecords(previous, candidate)).toEqual([{ key: "single", value: 2 }]);
    expect(metricEvidence([...previous, candidate], "pb")).toMatchObject({ value: 2, entries: [candidate] });
  });
});
