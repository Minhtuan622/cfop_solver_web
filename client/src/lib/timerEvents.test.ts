import { describe, expect, it } from "vitest";
import { DEFAULT_TIMER_EVENT, filterTimerEventEntries, isThreeByThreeEvent, isTimerEventId, normalizeTimerEventId, timerEventLabel, timerPreviewPuzzleId } from "./timerEvents";

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

  it("maps supported visual previews to their cubing.js puzzle IDs", () => {
    expect(timerPreviewPuzzleId("222")).toBe("2x2x2");
    expect(timerPreviewPuzzleId("pyram")).toBe("pyraminx");
    expect(timerPreviewPuzzleId("skewb")).toBe("skewb");
    expect(timerPreviewPuzzleId("minx")).toBe("megaminx");
    expect(timerPreviewPuzzleId("sq1")).toBe("square1");
    expect(timerPreviewPuzzleId("clock")).toBe("clock");
    expect(timerPreviewPuzzleId("444")).toBe("4x4x4");
    expect(timerPreviewPuzzleId("555")).toBe("5x5x5");
    expect(timerPreviewPuzzleId("666")).toBe("6x6x6");
    expect(timerPreviewPuzzleId("777")).toBe("7x7x7");
  });
});
