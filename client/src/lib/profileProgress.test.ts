import { describe, expect, it } from "vitest";
import { profileProgressByDay } from "./profileProgress";
import type { SolveHistoryEntry } from "./solveHistory";

function solve(id: string, createdAt: number, elapsedMs: number): SolveHistoryEntry { return { id, createdAt, elapsedMs, inspectionMs: 0, input: "R U R'", inputKind: "scramble", moves: 3, penalty: "none", solution: "", note: "", tags: [], phaseSplits: [] }; }

describe("profileProgressByDay", () => {
  it("gộp nhiều solve trong một ngày và phản ánh Best/Ao5 tích luỹ", () => {
    const dayOne = new Date("2026-08-01T08:00:00").getTime();
    const dayTwo = new Date("2026-08-02T08:00:00").getTime();
    const points = profileProgressByDay([
      solve("a", dayOne, 18_000), solve("b", dayOne + 1_000, 16_000), solve("c", dayOne + 2_000, 15_000), solve("d", dayOne + 3_000, 14_000), solve("e", dayOne + 4_000, 13_000), solve("f", dayTwo, 12_000),
    ]);
    expect(points).toHaveLength(2);
    expect(points[0]).toMatchObject({ best: 13_000, ao5: 15_000 });
    expect(points[1]).toMatchObject({ best: 12_000, ao5: 14_000 });
  });
});
