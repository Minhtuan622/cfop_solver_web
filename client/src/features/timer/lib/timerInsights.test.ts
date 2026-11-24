import { describe, expect, it } from "vitest";
import {
  dailyHeatmap,
  monthComparison,
  subXStreak,
  suggestSubXThresholds,
  timeDistribution,
  weekComparison,
} from "./timerInsights";

type Entry = Parameters<typeof timeDistribution>[0][number];

const solve = (
  createdAt: number,
  elapsedMs: number,
  penalty: Entry["penalty"] = "none"
): Entry => ({ createdAt, elapsedMs, penalty });

describe("timeDistribution", () => {
  it("returns no bins for an empty or all-DNF history", () => {
    expect(timeDistribution([])).toEqual([]);
    expect(timeDistribution([solve(1, 9000, "DNF")])).toEqual([]);
  });

  it("counts every valid solve exactly once and ignores DNF", () => {
    const entries = [
      solve(1, 9100),
      solve(2, 9900),
      solve(3, 12_400),
      solve(4, 15_000, "DNF"),
      solve(5, 10_000, "+2"),
    ];
    const bins = timeDistribution(entries, 6);
    expect(bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(4);
    for (const bin of bins) expect(bin.toMs).toBeGreaterThan(bin.fromMs);
    const bin12 = bins.find(bin => 12_000 >= bin.fromMs && 12_000 < bin.toMs);
    expect(bin12?.count).toBeGreaterThanOrEqual(1);
  });

  it("handles identical times", () => {
    const bins = timeDistribution([solve(1, 8000), solve(2, 8000)]);
    expect(bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(2);
  });
});

describe("dailyHeatmap", () => {
  const now = new Date(2026, 10, 23, 15, 0).getTime();
  const day = (offset: number, hour = 10) =>
    new Date(2026, 10, 23 - offset, hour).getTime();

  it("returns one cell per day ending today, oldest first", () => {
    const cells = dailyHeatmap([], 7, now);
    expect(cells).toHaveLength(7);
    expect(cells[6].key).toBe("2026-11-23");
    expect(cells[0].key).toBe("2026-11-17");
    expect(cells.every(cell => cell.level === 0)).toBe(true);
  });

  it("scales levels against the busiest day", () => {
    const entries = [
      ...Array.from({ length: 8 }, () => ({ createdAt: day(0) })),
      { createdAt: day(1) },
      { createdAt: day(30) },
    ];
    const cells = dailyHeatmap(entries, 7, now);
    expect(cells[6].count).toBe(8);
    expect(cells[6].level).toBe(4);
    expect(cells[5].count).toBe(1);
    expect(cells[5].level).toBe(1);
    expect(cells.reduce((sum, cell) => sum + cell.count, 0)).toBe(9);
  });
});

describe("subXStreak", () => {
  it("tracks the running and best streak, breaking on DNF and slow solves", () => {
    const entries = [
      solve(1, 9000),
      solve(2, 9500),
      solve(3, 9800),
      solve(4, 11_000),
      solve(5, 9000),
      solve(6, 9000, "DNF"),
      solve(7, 8000),
      solve(8, 8500),
    ];
    expect(subXStreak(entries, 10_000)).toEqual({
      thresholdMs: 10_000,
      current: 2,
      best: 3,
    });
  });

  it("does not depend on input order", () => {
    const entries = [solve(3, 9000), solve(1, 12_000), solve(2, 9000)];
    expect(subXStreak(entries, 10_000).current).toBe(2);
  });

  it("treats +2 as slower than the raw time", () => {
    expect(subXStreak([solve(1, 9000, "+2")], 10_000).current).toBe(0);
  });
});

describe("suggestSubXThresholds", () => {
  it("proposes round thresholds above the best time", () => {
    const entries = [solve(1, 8200), solve(2, 10_400), solve(3, 11_900)];
    const thresholds = suggestSubXThresholds(entries);
    expect(thresholds.length).toBeGreaterThan(0);
    expect(thresholds[0]).toBeGreaterThan(8200);
    expect(thresholds.every(value => value % 1000 === 0)).toBe(true);
  });

  it("returns nothing without valid solves", () => {
    expect(suggestSubXThresholds([])).toEqual([]);
  });
});

describe("period comparison", () => {
  const now = new Date(2026, 10, 25, 12).getTime();
  const at = (month: number, dayOfMonth: number) =>
    new Date(2026, month, dayOfMonth, 9).getTime();

  it("compares this week with last week", () => {
    const entries = [
      solve(at(10, 24), 10_000),
      solve(at(10, 23), 12_000),
      solve(at(10, 20), 14_000),
      solve(at(10, 18), 18_000),
      solve(at(10, 10), 5000),
    ];
    const result = weekComparison(entries, now);
    expect(result.current).toEqual({ count: 2, meanMs: 11_000, bestMs: 10_000 });
    expect(result.previous).toEqual({ count: 2, meanMs: 16_000, bestMs: 14_000 });
    expect(result.meanDeltaMs).toBe(-5000);
  });

  it("compares this month with last month and tolerates an empty period", () => {
    const entries = [solve(at(10, 2), 9000), solve(at(9, 15), 11_000)];
    const result = monthComparison(entries, now);
    expect(result.current.count).toBe(1);
    expect(result.previous.bestMs).toBe(11_000);
    expect(result.meanDeltaMs).toBe(-2000);
    expect(monthComparison([], now).meanDeltaMs).toBeNull();
  });
});
