import { describe, expect, it } from "vitest";
import { reviewSchedule } from "./reviewSchedule";

const lane = (...records: Array<[number, number]>) => ({
  study: {
    records: Object.fromEntries(
      records.map(([attempts, dueAt], index) => [`k${index}`, { attempts, dueAt }])
    ),
  },
});
const NOW = 1_000_000_000;
const HOUR = 3_600_000;

describe("reviewSchedule", () => {
  it("is empty without studied cases", () => {
    expect(reviewSchedule([], NOW)).toEqual({ nextDueAt: null, dueCount: 0 });
    expect(reviewSchedule([lane([0, NOW - 5]), undefined], NOW)).toEqual({
      nextDueAt: null,
      dueCount: 0,
    });
  });

  it("counts overdue cases across lanes and reports the earliest due time", () => {
    const result = reviewSchedule(
      [lane([2, NOW - 5 * HOUR], [1, NOW - HOUR]), lane([3, NOW - 2 * HOUR], [1, NOW + 48 * HOUR])],
      NOW
    );
    expect(result).toEqual({ nextDueAt: NOW - 5 * HOUR, dueCount: 3 });
  });

  it("groups the next batch when nothing is due yet", () => {
    const result = reviewSchedule(
      [lane([1, NOW + 24 * HOUR], [1, NOW + 24 * HOUR + 1000], [1, NOW + 72 * HOUR])],
      NOW
    );
    expect(result).toEqual({ nextDueAt: NOW + 24 * HOUR, dueCount: 2 });
  });
});
