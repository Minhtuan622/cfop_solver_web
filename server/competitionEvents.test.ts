import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MAX_STREAMS_PER_ACCOUNT,
  acquireCompetitionStream,
  competitionSubscriberCount,
  publishCompetitionEvent,
  releaseCompetitionStream,
  resetCompetitionEventBus,
  subscribeCompetitionEvents,
} from "./services/competitionEventBus";

afterEach(() => resetCompetitionEventBus());

describe("competition event bus", () => {
  it("delivers events only to subscribers of the same room", () => {
    const a = vi.fn();
    const b = vi.fn();
    subscribeCompetitionEvents(1, a);
    subscribeCompetitionEvents(2, b);
    publishCompetitionEvent(1, "result");
    expect(a).toHaveBeenCalledTimes(1);
    expect(a.mock.calls[0][0]).toMatchObject({ type: "result" });
    expect(b).not.toHaveBeenCalled();
  });

  it("stops delivering after unsubscribe and frees the room entry", () => {
    const listener = vi.fn();
    const off = subscribeCompetitionEvents(7, listener);
    expect(competitionSubscriberCount(7)).toBe(1);
    off();
    expect(competitionSubscriberCount(7)).toBe(0);
    publishCompetitionEvent(7, "message");
    expect(listener).not.toHaveBeenCalled();
  });

  it("keeps notifying others when one listener throws", () => {
    const good = vi.fn();
    subscribeCompetitionEvents(3, () => {
      throw new Error("broken stream");
    });
    subscribeCompetitionEvents(3, good);
    expect(() => publishCompetitionEvent(3, "round")).not.toThrow();
    expect(good).toHaveBeenCalledTimes(1);
  });

  it("caps concurrent streams per account and releases slots", () => {
    for (let i = 0; i < MAX_STREAMS_PER_ACCOUNT; i += 1)
      expect(acquireCompetitionStream(9)).toBe(true);
    expect(acquireCompetitionStream(9)).toBe(false);
    expect(acquireCompetitionStream(10)).toBe(true);
    releaseCompetitionStream(9);
    expect(acquireCompetitionStream(9)).toBe(true);
  });
});
