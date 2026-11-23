import { describe, expect, it } from "vitest";
import {
  ROUND_TIME_TOLERANCE_MS,
  competitionIntegrityFlags,
  parseIntegrityFlags,
  serializeIntegrityFlags,
} from "./services/competitionIntegrity";

const START = Date.UTC(2026, 10, 23, 12, 0, 0);
const base = {
  eventId: "333",
  elapsedMs: 12_340,
  inspectionMs: 8_000,
  roundStartedAt: START,
  now: START + 60_000,
  previousElapsedMs: [] as number[],
};

describe("competitionIntegrityFlags", () => {
  it("raises nothing for an ordinary solve", () => {
    expect(competitionIntegrityFlags(base)).toEqual([]);
  });

  it("flags a claimed time longer than the round has been open", () => {
    expect(
      competitionIntegrityFlags({ ...base, elapsedMs: 90_000, now: START + 20_000 })
    ).toContain("impossible_time");
  });

  it("allows for network and clock slack", () => {
    const elapsed = 20_000;
    const now = START + elapsed + base.inspectionMs - 1_000;
    expect(competitionIntegrityFlags({ ...base, elapsedMs: elapsed, now })).toEqual([]);
    expect(
      competitionIntegrityFlags({
        ...base,
        elapsedMs: elapsed,
        now: START + elapsed + base.inspectionMs - ROUND_TIME_TOLERANCE_MS - 1,
      })
    ).toContain("impossible_time");
  });

  it("accepts a Date for the round start", () => {
    expect(
      competitionIntegrityFlags({ ...base, roundStartedAt: new Date(START) })
    ).toEqual([]);
  });

  it("flags times well under the world record of the event only", () => {
    expect(competitionIntegrityFlags({ ...base, elapsedMs: 1_200 })).toContain("too_fast");
    expect(competitionIntegrityFlags({ ...base, elapsedMs: 3_200 })).toEqual([]);
    expect(
      competitionIntegrityFlags({ ...base, eventId: "333bf", elapsedMs: 3_000 })
    ).toEqual([]);
    expect(
      competitionIntegrityFlags({ ...base, eventId: "222", elapsedMs: 250 })
    ).toContain("too_fast");
  });

  it("flags an exact repeat of an earlier time by the same player", () => {
    expect(
      competitionIntegrityFlags({ ...base, previousElapsedMs: [9_990, 12_340] })
    ).toEqual(["repeated_time"]);
    expect(competitionIntegrityFlags({ ...base, previousElapsedMs: [12_341] })).toEqual([]);
  });

  it("can raise several flags at once", () => {
    expect(
      competitionIntegrityFlags({
        ...base,
        elapsedMs: 1_000,
        now: START + 100,
        previousElapsedMs: [1_000],
      })
    ).toEqual(["impossible_time", "too_fast", "repeated_time"]);
  });
});

describe("integrity flag storage", () => {
  it("round-trips and ignores unknown or empty values", () => {
    const stored = serializeIntegrityFlags(["too_fast", "repeated_time"]);
    expect(parseIntegrityFlags(stored)).toEqual(["too_fast", "repeated_time"]);
    expect(parseIntegrityFlags("")).toEqual([]);
    expect(parseIntegrityFlags(null)).toEqual([]);
    expect(parseIntegrityFlags("too_fast,unknown")).toEqual(["too_fast"]);
  });
});
