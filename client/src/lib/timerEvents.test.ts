import { describe, expect, it } from "vitest";
import { DEFAULT_TIMER_EVENT, filterTimerEventEntries, isThreeByThreeEvent, isTimerEventId, normalizeTimerEventId, timerEventLabel } from "./timerEvents";

describe("timer events", () => {
  it("recognizes supported event IDs and defaults missing legacy history to 3×3", () => {
    expect(isTimerEventId("444")).toBe(true);
    expect(isTimerEventId("invalid")).toBe(false);
    expect(normalizeTimerEventId(undefined)).toBe(DEFAULT_TIMER_EVENT);
    expect(normalizeTimerEventId("invalid")).toBe(DEFAULT_TIMER_EVENT);
  });

  it("keeps CFOP-only tooling exclusive to 3×3 and labels WCA events", () => {
    expect(isThreeByThreeEvent("333")).toBe(true);
    expect(isThreeByThreeEvent("pyram")).toBe(false);
    expect(timerEventLabel("sq1", "vi")).toBe("Square-1");
  });

  it("separates current event records and treats untagged legacy solves as 3×3", () => {
    const entries = [{ id: "legacy" }, { id: "two", eventId: "222" }, { id: "four", eventId: "444" }];
    expect(filterTimerEventEntries(entries, "333").map((entry) => entry.id)).toEqual(["legacy"]);
    expect(filterTimerEventEntries(entries, "444").map((entry) => entry.id)).toEqual(["four"]);
  });
});
