import { describe, expect, it } from "vitest";
import {
  MAX_CLOUD_TIMER_ENTRIES,
  MAX_CLOUD_TIMER_TOMBSTONES,
  cloudStateInput,
} from "./routers/inputs";

const payload = (timerLength: number) => ({
  schema: "cfop-account-cloud-state" as const,
  schemaVersion: 2 as const,
  baseVersion: null,
  capturedAt: 1_700_000_000_000,
  timer: Array.from({ length: timerLength }, (_, index) => ({ id: `s${index}` })),
  lastLayer: { study: {}, masteredCaseKeys: [] },
  bldProfile: {},
  bldLearningPath: {},
});

describe("cloudStateInput: lịch sử Timer gửi kèm tombstone", () => {
  it("nhận 500 lượt đang hiển thị cộng 100 lượt đã xoá", () => {
    expect(MAX_CLOUD_TIMER_ENTRIES).toBe(500);
    expect(MAX_CLOUD_TIMER_TOMBSTONES).toBe(100);
    expect(cloudStateInput.safeParse(payload(MAX_CLOUD_TIMER_ENTRIES + MAX_CLOUD_TIMER_TOMBSTONES)).success).toBe(true);
  });

  it("từ chối khi vượt quá giới hạn", () => {
    expect(cloudStateInput.safeParse(payload(MAX_CLOUD_TIMER_ENTRIES + MAX_CLOUD_TIMER_TOMBSTONES + 1)).success).toBe(false);
  });
});
