import { effectiveTime, type SolveHistoryEntry } from "./solveHistory";
import { compareMultiBlindResults, multiBlindResult } from "./multiBlind";

export const RECORD_WINDOWS = [5, 12, 50, 100] as const;
export type PersonalRecordKey = "single" | `ao${(typeof RECORD_WINDOWS)[number]}`;
export type PersonalRecord = { key: PersonalRecordKey; value: number };
export type TimerMetricKey = "pb" | `ao${(typeof RECORD_WINDOWS)[number]}` | "total";
export type AverageExclusion = "best" | "worst";
export type MetricEvidence = { entries: SolveHistoryEntry[]; value: number | null | undefined; exclusions: Record<string, AverageExclusion> };

function multiBlindCandidate(entry: SolveHistoryEntry) {
  const time = effectiveTime(entry);
  if (!entry.multiBlind || time === null) return null;
  const result = multiBlindResult(entry.multiBlind, time);
  return result.valid ? { entry, time, result } : null;
}

function bestMultiBlind(entries: SolveHistoryEntry[]) {
  return entries.flatMap((entry) => {
    const candidate = multiBlindCandidate(entry);
    return candidate ? [candidate] : [];
  }).sort((left, right) => compareMultiBlindResults(left.result, right.result, left.time, right.time))[0];
}

export function rollingAverage(sample: SolveHistoryEntry[]) {
  const numeric = sample.map(effectiveTime).filter((value): value is number => value !== null).sort((a, b) => a - b);
  const dnf = sample.length - numeric.length;
  if (dnf >= 2) return null;
  const core = dnf === 1 ? numeric.slice(1) : numeric.slice(1, -1);
  return core.length ? core.reduce((sum, value) => sum + value, 0) / core.length : null;
}

export function bestRollingAverage(entries: SolveHistoryEntry[], windowSize: number) {
  let best: number | undefined;
  for (let start = 0; start + windowSize <= entries.length; start += 1) {
    const value = rollingAverage(entries.slice(start, start + windowSize));
    if (value !== null && (best === undefined || value < best)) best = value;
  }
  return best;
}

function averageExclusions(sample: SolveHistoryEntry[]): Record<string, AverageExclusion> {
  const numeric = sample.map((entry, index) => ({ entry, index, value: effectiveTime(entry) })).filter((item): item is { entry: SolveHistoryEntry; index: number; value: number } => item.value !== null);
  const dnf = sample.find((entry) => effectiveTime(entry) === null);
  if (!numeric.length || sample.length - numeric.length >= 2) return {};
  const best = numeric.reduce((current, item) => item.value < current.value ? item : current);
  if (dnf) return { [best.entry.id]: "best", [dnf.id]: "worst" };
  const worst = numeric.filter((item) => item.index !== best.index).reduce((current, item) => item.value > current.value ? item : current);
  return { [best.entry.id]: "best", [worst.entry.id]: "worst" };
}

/** Returns the concrete history rows that explain the currently displayed Timer metric. */
export function metricEvidence(entries: SolveHistoryEntry[], key: TimerMetricKey): MetricEvidence {
  if (key === "total") return { entries, value: entries.length, exclusions: {} };
  if (key === "pb") {
    const multiBlind = bestMultiBlind(entries);
    if (multiBlind) return { entries: [multiBlind.entry], value: multiBlind.result.score, exclusions: {} };
    const valid = entries.filter((entry) => effectiveTime(entry) !== null);
    const best = valid.reduce<SolveHistoryEntry | undefined>((current, entry) => !current || (effectiveTime(entry) ?? Infinity) < (effectiveTime(current) ?? Infinity) ? entry : current, undefined);
    return { entries: best ? [best] : [], value: best ? effectiveTime(best) : undefined, exclusions: {} };
  }
  const size = Number(key.slice(2));
  const window = entries.slice(0, size);
  const hasWindow = window.length === size;
  return { entries: hasWindow ? window : [], value: hasWindow ? rollingAverage(window) : undefined, exclusions: hasWindow ? averageExclusions(window) : {} };
}

/** Compares a newly saved solve only with the history that existed before it. */
export function detectPersonalRecords(previousEntries: SolveHistoryEntry[], newEntry: SolveHistoryEntry[]): PersonalRecord[];
export function detectPersonalRecords(previousEntries: SolveHistoryEntry[], newEntry: SolveHistoryEntry): PersonalRecord[];
export function detectPersonalRecords(previousEntries: SolveHistoryEntry[], newEntry: SolveHistoryEntry | SolveHistoryEntry[]) {
  const entry = Array.isArray(newEntry) ? newEntry[0] : newEntry;
  if (!entry) return [];
  const records: PersonalRecord[] = [];
  const multiBlind = multiBlindCandidate(entry);
  if (multiBlind) {
    const prior = bestMultiBlind(previousEntries);
    if (!prior || compareMultiBlindResults(multiBlind.result, prior.result, multiBlind.time, prior.time) < 0) records.push({ key: "single", value: multiBlind.result.score });
    return records;
  }
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
