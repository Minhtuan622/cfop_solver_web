import { effectiveTime, type SolveHistoryEntry } from "@/lib/solveHistory";
import { bestRollingAverage } from "@/lib/timerRecords";
import { DEFAULT_TIMER_EVENT, normalizeTimerEventId, type TimerEventId } from "@/lib/timerEvents";

export type WcaTimerComparisonRow = {
  key: "single" | "ao5";
  label: string;
  timerMs: number | null;
  wcaMs: number | null;
  deltaMs: number | null;
};

type WcaEventRecord = {
  singleCentiseconds: number | null | undefined;
  averageCentiseconds: number | null | undefined;
};

function centisecondsToMilliseconds(value: number | null | undefined) {
  return typeof value === "number" && value >= 0 ? value * 10 : null;
}

export function wcaTimerComparison(entries: SolveHistoryEntry[], record: WcaEventRecord, eventId: TimerEventId = DEFAULT_TIMER_EVENT): WcaTimerComparisonRow[] {
  const eventEntries = entries.filter((entry) => normalizeTimerEventId(entry.eventId) === eventId);
  const singles = eventEntries.map(effectiveTime).filter((value): value is number => value !== null);
  const timerSingle = singles.length ? Math.min(...singles) : null;
  const timerAo5 = bestRollingAverage(eventEntries, 5) ?? null;
  const wcaSingle = centisecondsToMilliseconds(record.singleCentiseconds);
  const wcaAverage = centisecondsToMilliseconds(record.averageCentiseconds);

  return [
    { key: "single", label: "PB single", timerMs: timerSingle, wcaMs: wcaSingle, deltaMs: timerSingle !== null && wcaSingle !== null ? timerSingle - wcaSingle : null },
    { key: "ao5", label: "PB Ao5 / average", timerMs: timerAo5, wcaMs: wcaAverage, deltaMs: timerAo5 !== null && wcaAverage !== null ? timerAo5 - wcaAverage : null },
  ];
}

export type WcaRecordTarget = {
  key: WcaTimerComparisonRow["key"];
  /** Record in milliseconds, or null when the event has none. */
  worldMs: number | null;
  nationalMs: number | null;
  /** Timer result minus the record; positive means the timer is slower. */
  worldGapMs: number | null;
  nationalGapMs: number | null;
};

type RegionTable = ReadonlyArray<{ eventId: string; single: number | null; average: number | null }>;

// Where the timer's bests stand against the world and national records.
export function wcaRecordTargets(
  rows: readonly WcaTimerComparisonRow[],
  eventId: string,
  world: RegionTable,
  national: RegionTable | null
): WcaRecordTarget[] {
  const pick = (table: RegionTable | null, key: WcaTimerComparisonRow["key"]) => {
    const row = table?.find(item => item.eventId === eventId);
    return centisecondsToMilliseconds(key === "single" ? row?.single : row?.average);
  };
  return rows.map(row => {
    const worldMs = pick(world, row.key);
    const nationalMs = pick(national, row.key);
    return {
      key: row.key,
      worldMs,
      nationalMs,
      worldGapMs: row.timerMs !== null && worldMs !== null ? row.timerMs - worldMs : null,
      nationalGapMs: row.timerMs !== null && nationalMs !== null ? row.timerMs - nationalMs : null,
    };
  });
}
