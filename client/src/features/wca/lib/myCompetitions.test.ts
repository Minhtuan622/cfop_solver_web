import { describe, expect, it } from "vitest";
import {
  daysUntil,
  formatAttempt,
  formatClock,
  formatEntryFee,
  groupScheduleByDay,
  mapsUrl,
  registrationState,
  type ScheduleItem,
} from "./myCompetitions";

const base = {
  registrationOpen: "2026-10-01T00:00:00.000Z",
  registrationClose: "2026-12-01T00:00:00.000Z",
  startDate: "2026-12-20",
  endDate: "2026-12-21",
};

describe("my competitions helpers", () => {
  it("knows whether registration is not yet open, open or closed", () => {
    const today = "2026-09-01";
    expect(registrationState(base, new Date("2026-09-01T00:00:00Z"), today)).toBe("notYet");
    expect(registrationState(base, new Date("2026-11-01T00:00:00Z"), "2026-11-01")).toBe("open");
    expect(registrationState(base, new Date("2026-12-05T00:00:00Z"), "2026-12-05")).toBe("closed");
    expect(registrationState({ ...base, registrationOpen: null }, new Date(), today)).toBe("unknown");
    expect(registrationState(base, new Date("2027-01-01T00:00:00Z"), "2027-01-01")).toBe("closed");
  });

  it("counts days until a competition", () => {
    expect(daysUntil("2026-12-20", "2026-12-10")).toBe(10);
    expect(daysUntil("2026-12-10", "2026-12-10")).toBe(0);
  });

  it("formats the entry fee using the currency's own decimals", () => {
    expect(formatEntryFee(null, "en")).toBeNull();
    expect(formatEntryFee({ lowestDenomination: 2500, currency: "USD" }, "en")).toBe("$25.00");
    expect(formatEntryFee({ lowestDenomination: 65000, currency: "KRW" }, "en")).toContain("65,000");
  });

  it("shows schedule times in the venue time zone", () => {
    expect(formatClock("2026-12-12T03:30:00Z", "Asia/Ho_Chi_Minh", "en")).toBe("10:30");
    expect(formatClock("2026-12-12T03:30:00Z", "Not/AZone", "en")).toBe("03:30");
  });

  it("groups the schedule by day at the venue", () => {
    const item = (code: string, startTime: string): ScheduleItem => ({
      code,
      name: code,
      eventId: null,
      round: null,
      room: "A",
      startTime,
      endTime: startTime,
      timezone: "Asia/Ho_Chi_Minh",
    });
    // 18:30Z on the 12th is already the 13th in Vietnam (UTC+7).
    const days = groupScheduleByDay([
      item("a", "2026-12-12T03:00:00Z"),
      item("b", "2026-12-12T18:30:00Z"),
      item("c", "2026-12-12T04:00:00Z"),
    ]);
    expect(days.map(day => day.date)).toEqual(["2026-12-12", "2026-12-13"]);
    expect(days[0].items.map(entry => entry.code)).toEqual(["a", "c"]);
  });

  it("builds a map link from coordinates, falling back to the address", () => {
    expect(mapsUrl({ latitude: 21.03, longitude: 105.85, venueAddress: null, venue: null })).toBe(
      "https://www.google.com/maps/search/?api=1&query=21.03,105.85"
    );
    expect(mapsUrl({ latitude: null, longitude: null, venueAddress: "1 Phố Cổ", venue: null })).toContain("query=1%20Ph");
    expect(mapsUrl({ latitude: null, longitude: null, venueAddress: null, venue: null })).toBeNull();
  });

  it("formats attempts, including DNF and fewest moves", () => {
    expect(formatAttempt("333", 1234)).toBe("12.34");
    expect(formatAttempt("333", -1)).toBe("DNF");
    expect(formatAttempt("333", 0)).toBe("—");
    expect(formatAttempt("333fm", 31)).toBe("31");
  });
});
