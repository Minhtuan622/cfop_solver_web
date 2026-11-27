import { describe, expect, it } from "vitest";
import {
  countByTag,
  filterRecent,
  formatRatio,
  gapMs,
  ownBest,
  ratioToWorld,
  recordsForRegion,
  type RecentRecord,
  type RegionRecords,
} from "./recordsView";
import type { SolveHistoryEntry } from "@/lib/solveHistory";

const row = (eventId: string, single: number | null, average: number | null) => ({ eventId, single, average });

const data: RegionRecords = {
  world: [row("333", 347, 405), row("333mbf", 380350302, null)],
  continents: [{ id: "_Asia", name: "Asia", records: [row("333", 371, 419)] }],
  countries: [{ name: "Vietnam", iso2: "VN", records: [row("333", 600, 700)] }],
};

describe("records page helpers", () => {
  it("picks the record table of the chosen region", () => {
    expect(recordsForRegion(data, { kind: "world" })[0].single).toBe(347);
    expect(recordsForRegion(data, { kind: "continent", id: "_Asia" })[0].single).toBe(371);
    expect(recordsForRegion(data, { kind: "country", name: "Vietnam" })[0].average).toBe(700);
    expect(recordsForRegion(data, { kind: "country", name: "Nowhere" })).toEqual([]);
  });

  it("compares a regional record with the world record", () => {
    expect(ratioToWorld("333", "single", 694, data.world)).toBeCloseTo(2, 5);
    expect(ratioToWorld("333mbf", "single", 1, data.world)).toBeNull();
    expect(ratioToWorld("222", "single", 100, data.world)).toBeNull();
    expect(ratioToWorld("333", "average", null, data.world)).toBeNull();
    expect(formatRatio(1.234)).toBe("×1.23");
    expect(formatRatio(12.34)).toBe("×12.3");
  });

  it("measures the gap between your best and a record in milliseconds", () => {
    expect(gapMs(9000, 347)).toBe(9000 - 3470);
    expect(gapMs(null, 347)).toBeNull();
    expect(gapMs(9000, null)).toBeNull();
  });

  it("takes personal bests only from timed events in the solve history", () => {
    const entry = (eventId: string, elapsedMs: number): SolveHistoryEntry =>
      ({ id: `${eventId}-${elapsedMs}`, eventId, elapsedMs, penalty: "none", createdAt: 1 }) as unknown as SolveHistoryEntry;
    const entries = [entry("333", 12_000), entry("333", 9_500), entry("222", 3_000)];
    expect(ownBest(entries, "333")?.singleMs).toBe(9_500);
    expect(ownBest(entries, "444")).toBeNull();
    expect(ownBest(entries, "333fm")).toBeNull();
    expect(ownBest(entries, "magic")).toBeNull();
  });

  it("filters and counts recent records by level", () => {
    const record = (tag: string, id: string) => ({ id, tag }) as unknown as RecentRecord;
    const list = [record("WR", "a"), record("NR", "b"), record("NR", "c"), record("CR", "d")];
    expect(filterRecent(list, "ALL")).toHaveLength(4);
    expect(filterRecent(list, "NR").map(item => item.id)).toEqual(["b", "c"]);
    expect(countByTag(list)).toEqual({ WR: 1, CR: 1, NR: 2 });
  });
});
