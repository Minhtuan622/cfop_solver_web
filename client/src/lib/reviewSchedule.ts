import type { CaseStudyRecord } from "./caseStudy";

export type ReviewSchedule = {
  nextDueAt: number | null;
  dueCount: number;
};

export const REVIEW_BATCH_WINDOW_MS = 3_600_000;

type LaneLike = { study: { records: Record<string, Pick<CaseStudyRecord, "attempts" | "dueAt">> } };

export function reviewSchedule(
  lanes: ReadonlyArray<LaneLike | undefined>,
  now = Date.now()
): ReviewSchedule {
  const dueTimes: number[] = [];
  for (const lane of lanes) {
    if (!lane) continue;
    for (const record of Object.values(lane.study.records)) {
      if (record.attempts > 0 && record.dueAt > 0) dueTimes.push(record.dueAt);
    }
  }
  if (!dueTimes.length) return { nextDueAt: null, dueCount: 0 };
  const nextDueAt = Math.min(...dueTimes);
  const cutoff = Math.max(now, nextDueAt) + REVIEW_BATCH_WINDOW_MS;
  return {
    nextDueAt,
    dueCount: dueTimes.filter(time => time <= cutoff).length,
  };
}
