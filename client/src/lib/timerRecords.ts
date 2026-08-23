import { effectiveTime, type SolveHistoryEntry } from "./solveHistory";

export const RECORD_WINDOWS = [5, 12, 50, 100] as const;
export type PersonalRecordKey = "single" | `ao${(typeof RECORD_WINDOWS)[number]}`;
export type PersonalRecord = { key: PersonalRecordKey; value: number };

export function rollingAverage(sample: SolveHistoryEntry[]) {
  const numeric = sample.map(effectiveTime).filter((value): value is number => value !== null).sort((a, b) => a - b);
  const dnf = sample.length - numeric.length;
  if (dnf >= 2) return null;
  const core = dnf === 1 ? numeric.slice(1) : numeric.slice(1, -1);
  return core.length ? core.reduce((sum, value) => sum + value, 0) / core.length : null;
}

function bestRollingAverage(entries: SolveHistoryEntry[], windowSize: number) {
  let best: number | undefined;
  for (let start = 0; start + windowSize <= entries.length; start += 1) {
    const value = rollingAverage(entries.slice(start, start + windowSize));
    if (value !== null && (best === undefined || value < best)) best = value;
  }
  return best;
}

/** Compares a newly saved solve only with the history that existed before it. */
export function detectPersonalRecords(previousEntries: SolveHistoryEntry[], newEntry: SolveHistoryEntry[]): PersonalRecord[];
export function detectPersonalRecords(previousEntries: SolveHistoryEntry[], newEntry: SolveHistoryEntry): PersonalRecord[];
export function detectPersonalRecords(previousEntries: SolveHistoryEntry[], newEntry: SolveHistoryEntry | SolveHistoryEntry[]) {
  const entry = Array.isArray(newEntry) ? newEntry[0] : newEntry;
  if (!entry) return [];
  const records: PersonalRecord[] = [];
  const single = effectiveTime(entry);
  const previousSingles = previousEntries.map(effectiveTime).filter((value): value is number => value !== null);
  if (single !== null && (previousSingles.length === 0 || single < Math.min(...previousSingles))) records.push({ key: "single", value: single });

  for (const windowSize of RECORD_WINDOWS) {
    if (previousEntries.length + 1 < windowSize) continue;
    const candidate = rollingAverage([entry, ...previousEntries].slice(0, windowSize));
    if (candidate === null) continue;
    const priorBest = bestRollingAverage(previousEntries, windowSize);
    if (priorBest === undefined || candidate < priorBest) records.push({ key: `ao${windowSize}` as PersonalRecordKey, value: candidate });
  }
  return records;
}
