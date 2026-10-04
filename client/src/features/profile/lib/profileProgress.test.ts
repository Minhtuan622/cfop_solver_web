import { describe, expect, it } from "vitest";
import { filterProfileProgress, meetsAo5Goal, profileProgressByDay } from "./profileProgress";
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

  it("lọc 7 hoặc 30 ngày nhưng giữ giá trị tích luỹ của các điểm còn lại", () => {
    const now = new Date("2026-08-31T12:00:00").getTime();
    const points = profileProgressByDay([
      solve("old", new Date("2026-07-01T08:00:00").getTime(), 20_000),
      solve("month", new Date("2026-08-02T08:00:00").getTime(), 18_000),
      solve("week", new Date("2026-08-26T08:00:00").getTime(), 16_000),
    ]);
    expect(filterProfileProgress(points, "30d", now).map((point) => point.day)).toEqual(["02-08", "26-08"]);
    expect(filterProfileProgress(points, "7d", now).map((point) => point.day)).toEqual(["26-08"]);
    expect(filterProfileProgress(points, "all", now)).toHaveLength(3);
  });

  it("chỉ công nhận mục tiêu khi Ao5 hợp lệ không vượt quá sub-X", () => {
    expect(meetsAo5Goal(14_980, 15_000)).toBe(true);
    expect(meetsAo5Goal(15_001, 15_000)).toBe(false);
    expect(meetsAo5Goal(null, 15_000)).toBe(false);
    expect(meetsAo5Goal(14_000, null)).toBe(false);
  });
});
