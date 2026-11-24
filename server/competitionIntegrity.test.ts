import { describe, expect, it } from "vitest";
import {
  ROUND_TIME_TOLERANCE_MS,
  competitionIntegrityFlags,
  isBelowHardFloor,
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

describe("isBelowHardFloor", () => {
  it("cho phép kết quả thật dưới 1 giây ở 2×2, Pyraminx và Skewb", () => {
    expect(isBelowHardFloor("222", 430)).toBe(false);
    expect(isBelowHardFloor("pyram", 730)).toBe(false);
    expect(isBelowHardFloor("skewb", 750)).toBe(false);
  });

  it("chặn thời gian không thể có ở từng thể thức", () => {
    expect(isBelowHardFloor("333", 900)).toBe(true);
    expect(isBelowHardFloor("222", 100)).toBe(true);
    expect(isBelowHardFloor("777", 20_000)).toBe(true);
    expect(isBelowHardFloor("clock", 500)).toBe(true);
  });

  it("không đặt ngưỡng cứng cho thể thức chưa biết hoặc FMC", () => {
    expect(isBelowHardFloor("333fm", 1)).toBe(false);
    expect(isBelowHardFloor("unknown", 1)).toBe(false);
  });

  it("ngưỡng cứng luôn thấp hơn ngưỡng gắn cờ", () => {
    for (const eventId of ["222", "333", "333oh", "444", "555", "666", "777", "pyram", "skewb", "minx", "sq1", "clock"]) {
      const flagged = competitionIntegrityFlags({ ...base, eventId, elapsedMs: 1, now: START + 600_000 });
      expect(flagged, eventId).toContain("too_fast");
      // Giá trị nằm giữa hai ngưỡng thì chỉ bị gắn cờ, không bị chặn.
      let between = 0;
      for (let ms = 1; ms < 60_000; ms += 50) {
        if (!isBelowHardFloor(eventId, ms) && competitionIntegrityFlags({ ...base, eventId, elapsedMs: ms, now: START + 600_000 }).includes("too_fast")) {
          between = ms;
          break;
        }
      }
      expect(between, eventId).toBeGreaterThan(0);
    }
  });
});
