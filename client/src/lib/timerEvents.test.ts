import { describe, expect, it } from "vitest";
import { DEFAULT_TIMER_EVENT, fallbackTimerScramble, filterTimerEventEntries, generateTimerScramble, isThreeByThreeEvent, isTimerEventId, normalizeTimerEventId, timerEventLabel, timerPreviewPuzzleId } from "./timerEvents";

describe("timer events", () => {
  it("recognizes supported event IDs and defaults missing legacy history to 3×3", () => {
    expect(isTimerEventId("444")).toBe(true);
    expect(isTimerEventId("444bf")).toBe(true);
    expect(isTimerEventId("555bf")).toBe(true);
    expect(isTimerEventId("fto")).toBe(true);
    expect(isTimerEventId("invalid")).toBe(false);
    expect(normalizeTimerEventId(undefined)).toBe(DEFAULT_TIMER_EVENT);
    expect(normalizeTimerEventId("invalid")).toBe(DEFAULT_TIMER_EVENT);
  });

  it("keeps CFOP-only tooling exclusive to 3×3 and labels WCA events", () => {
    expect(isThreeByThreeEvent("333")).toBe(true);
    expect(isThreeByThreeEvent("333oh")).toBe(true);
    expect(isThreeByThreeEvent("333bf")).toBe(true);
    expect(isThreeByThreeEvent("333fm")).toBe(true);
    expect(isThreeByThreeEvent("333mbf")).toBe(true);
    expect(isThreeByThreeEvent("444bf")).toBe(false);
    expect(isThreeByThreeEvent("555bf")).toBe(false);
    expect(isThreeByThreeEvent("pyram")).toBe(false);
    expect(isThreeByThreeEvent("fto")).toBe(false);
    expect(timerEventLabel("333oh", "vi")).toBe("3×3 OH");
    expect(timerEventLabel("333bf", "en")).toBe("3×3 BLD");
    expect(timerEventLabel("444bf", "vi")).toBe("4×4 BLD");
    expect(timerEventLabel("555bf", "en")).toBe("5×5 BLD");
    expect(timerEventLabel("fto", "vi")).toBe("FTO");
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
    expect(timerPreviewPuzzleId("fto")).toBe("fto");
    expect(timerPreviewPuzzleId("sq1")).toBe("square1");
    expect(timerPreviewPuzzleId("clock")).toBe("clock");
    expect(timerPreviewPuzzleId("444")).toBe("4x4x4");
    expect(timerPreviewPuzzleId("444bf")).toBe("4x4x4");
    expect(timerPreviewPuzzleId("555")).toBe("5x5x5");
    expect(timerPreviewPuzzleId("555bf")).toBe("5x5x5");
    expect(timerPreviewPuzzleId("666")).toBe("6x6x6");
    expect(timerPreviewPuzzleId("777")).toBe("7x7x7");
  });

  it("always returns a usable scramble for 3×3 modes", async () => {
    const scramble = await generateTimerScramble("333");
    expect(scramble.trim()).not.toBe("");
    // cubing.js writes a random-state scramble of 17 to 21 moves; the local
    // fallback writes 20. Anything shorter would not scramble the cube.
    expect(scramble.split(/\s+/).length).toBeGreaterThanOrEqual(17);
  });

  it("has a non-empty local fallback for every event in the selector", () => {
    for (const eventId of ["222", "333", "333oh", "333bf", "333fm", "333mbf", "444", "444bf", "555", "555bf", "666", "777", "pyram", "skewb", "minx", "fto", "sq1", "clock"] as const) {
      expect(fallbackTimerScramble(eventId), eventId).not.toBe("");
    }
  });
});
