import { readStoredJson, writeStoredValue } from "@/lib/browserStorage";

export type LaneProgress = { mastered: number; total: number };
export type LaneProgressMap = Partial<Record<string, LaneProgress>>;

const KEY = "cfop-study-lane-progress-v1";

const isProgress = (value: unknown): value is LaneProgress =>
  typeof value === "object" &&
  value !== null &&
  Number.isFinite((value as LaneProgress).mastered) &&
  Number.isFinite((value as LaneProgress).total);

export function readLaneProgress(): LaneProgressMap {
  const stored = readStoredJson<unknown>(KEY, {});
  if (typeof stored !== "object" || stored === null) return {};
  return Object.fromEntries(
    Object.entries(stored as Record<string, unknown>).filter(([, value]) =>
      isProgress(value)
    )
  ) as LaneProgressMap;
}

export function writeLaneProgress(
  lane: string,
  progress: LaneProgress
): LaneProgressMap {
  const current = readLaneProgress();
  if (progress.total <= 0) return current;
  const previous = current[lane];
  if (previous?.mastered === progress.mastered && previous.total === progress.total)
    return current;
  const next = { ...current, [lane]: progress };
  writeStoredValue(KEY, JSON.stringify(next));
  return next;
}
