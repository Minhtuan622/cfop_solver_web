/**
 * Lịch ôn tập tóm tắt cho thông báo nhắc: mốc đến hạn gần nhất và số case
 * trong đợt đó. Hàm thuần trên các `records` của lane học; không đọc
 * localStorage nên dùng lại được ở bất kỳ đâu.
 */
import type { CaseStudyRecord } from "./caseStudy";

export type ReviewSchedule = {
  /** Mốc đến hạn sớm nhất (epoch ms); `null` khi chưa có case nào được học. */
  nextDueAt: number | null;
  /** Số case đến hạn trong đợt đó (kể cả vài case đến hạn ngay sau mốc). */
  dueCount: number;
};

/** Các case đến hạn trong vòng 1 giờ sau mốc được gom thành một đợt. */
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
