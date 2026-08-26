import { effectiveTime, type SolveHistoryEntry } from "./solveHistory";
import { bestRollingAverage } from "./timerRecords";
import { DEFAULT_TIMER_EVENT, normalizeTimerEventId } from "./timerEvents";

export type WcaTimerComparisonRow = {
  key: "single" | "ao5";
  label: string;
  timerMs: number | null;
  wcaMs: number | null;
  deltaMs: number | null;
};

type ThreeByThreeWcaRecord = {
  singleCentiseconds: number | null | undefined;
  averageCentiseconds: number | null | undefined;
};

function centisecondsToMilliseconds(value: number | null | undefined) {
  return typeof value === "number" && value >= 0 ? value * 10 : null;
}

/** Compares local Timer PBs with official 3×3 WCA personal records without altering either data source. */
export function wcaTimerComparison(entries: SolveHistoryEntry[], record: ThreeByThreeWcaRecord): WcaTimerComparisonRow[] {
  const threeByThreeEntries = entries.filter((entry) => normalizeTimerEventId(entry.eventId) === DEFAULT_TIMER_EVENT);
  const singles = threeByThreeEntries.map(effectiveTime).filter((value): value is number => value !== null);
  const timerSingle = singles.length ? Math.min(...singles) : null;
  const timerAo5 = bestRollingAverage(threeByThreeEntries, 5) ?? null;
  const wcaSingle = centisecondsToMilliseconds(record.singleCentiseconds);
  const wcaAverage = centisecondsToMilliseconds(record.averageCentiseconds);

  return [
    { key: "single", label: "PB single", timerMs: timerSingle, wcaMs: wcaSingle, deltaMs: timerSingle !== null && wcaSingle !== null ? timerSingle - wcaSingle : null },
    { key: "ao5", label: "PB Ao5 / average", timerMs: timerAo5, wcaMs: wcaAverage, deltaMs: timerAo5 !== null && wcaAverage !== null ? timerAo5 - wcaAverage : null },
  ];
}
