// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  addPlayHistory,
  clearPlayHistory,
  deletePlayHistory,
  playEffectiveTime,
  playStats,
  readPlayHistory,
} from "./playHistory";

beforeEach(() => {
  window.localStorage.clear();
});

const sample = (overrides: Partial<Parameters<typeof addPlayHistory>[0]> = {}) =>
  addPlayHistory({
    elapsedMs: 10_000,
    inspectionMs: 2_000,
    penalty: "none" as const,
    scramble: "R U R' U'",
    solution: "R U R' U'",
    moves: 4,
    ...overrides,
  });

describe("playHistory", () => {
  it("stores, reads and deletes entries", () => {
    sample();
    sample({ elapsedMs: 12_000 });
    expect(readPlayHistory()).toHaveLength(2);
    const first = readPlayHistory()[0]!;
    expect(playStats(readPlayHistory()).count).toBe(2);
    deletePlayHistory(first.id);
    expect(readPlayHistory()).toHaveLength(1);
    clearPlayHistory();
    expect(readPlayHistory()).toHaveLength(0);
  });

  it("applies +2 and DNF penalties to the effective time", () => {
    sample({ penalty: "+2" });
    sample({ penalty: "DNF" });
    const [dnf, plusTwo] = readPlayHistory();
    expect(playEffectiveTime(dnf!)).toBeNull();
    expect(playEffectiveTime(plusTwo!)).toBe(12_000);
  });

  it("computes best and a WCA-trimmed ao5 from the last 5 solves", () => {
    for (const ms of [10_000, 11_000, 12_000, 13_000, 20_000]) {
      sample({ elapsedMs: ms });
    }
    const stats = playStats(readPlayHistory());
    expect(stats.bestMs).toBe(10_000);
    expect(stats.ao5Ms).toBe(12_000);
    sample({ penalty: "DNF" });
    const withDnf = playStats(readPlayHistory());
    expect(withDnf.ao5Ms).toBe(15_000);
  });

  it("returns null ao5 when two or more of the last 5 are DNF", () => {
    for (const ms of [10_000, 11_000, 12_000]) sample({ elapsedMs: ms });
    sample({ penalty: "DNF" });
    sample({ penalty: "DNF" });
    expect(playStats(readPlayHistory()).ao5Ms).toBeNull();
  });
});
