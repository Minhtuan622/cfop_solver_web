import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../../server/routers";
import { isTimerEventId, type TimerEventId } from "@/lib/timerEvents";
import { effectiveTime, type SolveHistoryEntry } from "@/lib/solveHistory";
import { bestRollingAverage } from "@/lib/timerRecords";
import { normalizeTimerEventId } from "@/lib/timerEvents";

type WcaOutput = inferRouterOutputs<AppRouter>["wca"];

export type RegionRecords = WcaOutput["records"];
export type RecordRow = RegionRecords["world"][number];
export type RecentRecord = WcaOutput["recentRecords"][number];

export type Region =
  | { kind: "world" }
  | { kind: "continent"; id: string }
  | { kind: "country"; name: string };

export function recordsForRegion(data: RegionRecords, region: Region): readonly RecordRow[] {
  if (region.kind === "world") return data.world;
  if (region.kind === "continent") return data.continents.find(item => item.id === region.id)?.records ?? [];
  return data.countries.find(item => item.name === region.name)?.records ?? [];
}

// How much slower the regional record is than the world record, as a ratio.
// Fewest-moves singles are move counts and multi-blind has no time scale, so
// they are compared by value only where it makes sense.
export function ratioToWorld(
  eventId: string,
  field: "single" | "average",
  value: number | null,
  world: readonly RecordRow[]
): number | null {
  if (value === null || eventId === "333mbf") return null;
  const reference = world.find(row => row.eventId === eventId)?.[field];
  if (!reference || reference <= 0) return null;
  return value / reference;
}

export function formatRatio(ratio: number): string {
  return `×${ratio.toFixed(ratio >= 10 ? 1 : 2)}`;
}

export type OwnBest = {
  singleMs: number | null;
  averageMs: number | null;
};

const NOT_TIMED = new Set(["333fm", "333mbf"]);

// Personal bests from the solve history for events the timer also records.
export function ownBest(entries: readonly SolveHistoryEntry[], eventId: string): OwnBest | null {
  if (NOT_TIMED.has(eventId) || !isTimerEventId(eventId)) return null;
  const timerEvent: TimerEventId = eventId;
  const own = entries.filter(entry => normalizeTimerEventId(entry.eventId) === timerEvent);
  const times = own.map(effectiveTime).filter((value): value is number => value !== null);
  if (times.length === 0) return null;
  return { singleMs: Math.min(...times), averageMs: bestRollingAverage(own, 5) ?? null };
}

export function gapMs(ownMs: number | null, recordCentiseconds: number | null): number | null {
  if (ownMs === null || recordCentiseconds === null || recordCentiseconds <= 0) return null;
  return ownMs - recordCentiseconds * 10;
}

export type TagFilter = "ALL" | "WR" | "CR" | "NR";

export function filterRecent(records: readonly RecentRecord[], tag: TagFilter): RecentRecord[] {
  return tag === "ALL" ? [...records] : records.filter(record => record.tag === tag);
}

export function countByTag(records: readonly RecentRecord[]): Record<"WR" | "CR" | "NR", number> {
  const counts = { WR: 0, CR: 0, NR: 0 };
  for (const record of records) if (record.tag in counts) counts[record.tag as keyof typeof counts] += 1;
  return counts;
}
