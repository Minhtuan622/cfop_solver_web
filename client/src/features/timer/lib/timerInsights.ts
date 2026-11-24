import { effectiveTime, type SolveHistoryEntry } from "@/lib/solveHistory";
import { dayKey } from "./dailyDigest";

type TimedEntry = Pick<SolveHistoryEntry, "createdAt" | "elapsedMs" | "penalty">;

export type TimeBin = { fromMs: number; toMs: number; count: number };

function timeOf(entry: TimedEntry) {
  return effectiveTime(entry as SolveHistoryEntry);
}

function validTimes(entries: ReadonlyArray<TimedEntry>) {
  const times: number[] = [];
  for (const entry of entries) {
    const ms = timeOf(entry);
    if (ms !== null) times.push(ms);
  }
  return times;
}

function niceBinWidth(rangeMs: number, target: number) {
  const raw = Math.max(rangeMs / target, 1);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  for (const step of [1, 2, 5, 10]) {
    if (step * magnitude >= raw) return step * magnitude;
  }
  return 10 * magnitude;
}

export function timeDistribution(
  entries: ReadonlyArray<TimedEntry>,
  targetBins = 12
): TimeBin[] {
  const times = validTimes(entries);
  if (!times.length) return [];
  const min = Math.min(...times);
  const max = Math.max(...times);
  const width = niceBinWidth(max - min || 1000, targetBins);
  const start = Math.floor(min / width) * width;
  const count = Math.floor((max - start) / width) + 1;
  const bins: TimeBin[] = Array.from({ length: count }, (_, index) => ({
    fromMs: start + index * width,
    toMs: start + (index + 1) * width,
    count: 0,
  }));
  for (const ms of times) bins[Math.floor((ms - start) / width)].count += 1;
  return bins;
}

export type HeatmapDay = {
  key: string;
  date: number;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

export function dailyHeatmap(
  entries: ReadonlyArray<{ createdAt: number }>,
  days = 84,
  now = Date.now()
): HeatmapDay[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const key = dayKey(entry.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  const result: HeatmapDay[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(cursor);
    day.setDate(cursor.getDate() - offset);
    const key = dayKey(day.getTime());
    result.push({
      key,
      date: day.getTime(),
      count: counts.get(key) ?? 0,
      level: 0,
    });
  }
  const peak = Math.max(0, ...result.map(day => day.count));
  for (const day of result) {
    day.level = !day.count
      ? 0
      : (Math.min(4, Math.max(1, Math.ceil((day.count / peak) * 4))) as
          | 1
          | 2
          | 3
          | 4);
  }
  return result;
}

export type SubXStreak = {
  thresholdMs: number;
  current: number;
  best: number;
};

export function subXStreak(
  entries: ReadonlyArray<TimedEntry>,
  thresholdMs: number
): SubXStreak {
  const ordered = [...entries].sort((a, b) => a.createdAt - b.createdAt);
  let current = 0;
  let best = 0;
  for (const entry of ordered) {
    const ms = timeOf(entry);
    if (ms !== null && ms < thresholdMs) {
      current += 1;
      best = Math.max(best, current);
    } else current = 0;
  }
  return { thresholdMs, current, best };
}

export function suggestSubXThresholds(
  entries: ReadonlyArray<TimedEntry>,
  count = 3
): number[] {
  const times = validTimes(entries).sort((a, b) => a - b);
  if (!times.length) return [];
  const median = times[Math.floor(times.length / 2)];
  const step = median >= 60_000 ? 10_000 : median >= 20_000 ? 5_000 : 1_000;
  const base = Math.max(step, Math.floor(times[0] / step) * step + step);
  const limit = Math.ceil(median / step) * step + step * 2;
  const thresholds: number[] = [];
  for (let value = base; thresholds.length < count && value <= limit; value += step)
    thresholds.push(value);
  return thresholds;
}

export type PeriodStats = {
  count: number;
  meanMs: number | null;
  bestMs: number | null;
};
export type PeriodComparison = {
  current: PeriodStats;
  previous: PeriodStats;
  meanDeltaMs: number | null;
};

function periodStats(
  entries: ReadonlyArray<TimedEntry>,
  from: number,
  to: number
): PeriodStats {
  const inRange = entries.filter(
    entry => entry.createdAt >= from && entry.createdAt < to
  );
  const times = validTimes(inRange);
  return {
    count: inRange.length,
    meanMs: times.length
      ? times.reduce((sum, ms) => sum + ms, 0) / times.length
      : null,
    bestMs: times.length ? Math.min(...times) : null,
  };
}

function compare(
  entries: ReadonlyArray<TimedEntry>,
  currentFrom: Date,
  previousFrom: Date,
  now: number
): PeriodComparison {
  const current = periodStats(entries, currentFrom.getTime(), now + 1);
  const previous = periodStats(
    entries,
    previousFrom.getTime(),
    currentFrom.getTime()
  );
  return {
    current,
    previous,
    meanDeltaMs:
      current.meanMs !== null && previous.meanMs !== null
        ? current.meanMs - previous.meanMs
        : null,
  };
}

export function weekComparison(
  entries: ReadonlyArray<TimedEntry>,
  now = Date.now()
) {
  const currentFrom = new Date(now);
  currentFrom.setHours(0, 0, 0, 0);
  currentFrom.setDate(currentFrom.getDate() - ((currentFrom.getDay() + 6) % 7));
  const previousFrom = new Date(currentFrom);
  previousFrom.setDate(previousFrom.getDate() - 7);
  return compare(entries, currentFrom, previousFrom, now);
}

export function monthComparison(
  entries: ReadonlyArray<TimedEntry>,
  now = Date.now()
) {
  const date = new Date(now);
  const currentFrom = new Date(date.getFullYear(), date.getMonth(), 1);
  const previousFrom = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return compare(entries, currentFrom, previousFrom, now);
}
