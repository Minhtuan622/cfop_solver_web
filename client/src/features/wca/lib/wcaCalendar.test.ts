import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRESET_ID,
  RANGE_PRESETS,
  addDays,
  flagEmoji,
  formatDayRange,
  groupByMonth,
  locationLabel,
  matchesQuery,
  monthLabel,
  parseVenue,
  toIsoDate,
  type WcaCompetition,
} from "./wcaCalendar";

function competition(overrides: Partial<WcaCompetition> = {}): WcaCompetition {
  return {
    id: "1",
    name: "Hungarian Open 2026",
    startDate: "2026-10-23",
    endDate: "2026-10-26",
    countryName: "Hungary",
    countryIso2: "HU",
    cityName: "Budapest",
    venueName: null,
    status: "approved",
    website: null,
    wcaUrl: "https://www.worldcubeassociation.org/competitions/1",
    ...overrides,
  };
}

describe("the WCA calendar helpers", () => {
  it("takes a markdown venue apart so the raw link never reaches the page", () => {
    expect(parseVenue("[BOK Hall](https://bok.hu)")).toEqual({ text: "BOK Hall", href: "https://bok.hu" });
    expect(parseVenue("[BOK Hall](https://bok.hu) — main hall")).toEqual({
      text: "BOK Hall — main hall",
      href: "https://bok.hu",
    });
    expect(parseVenue("Plain Hall")).toEqual({ text: "Plain Hall", href: null });
    expect(parseVenue(null)).toEqual({ text: "", href: null });
  });

  it("shows one day, a range of days and a range that crosses a month", () => {
    expect(formatDayRange("2026-10-24", "2026-10-24", "vi")).toEqual({ days: "24", months: "tháng 10" });
    expect(formatDayRange("2026-10-23", "2026-10-26", "vi")).toEqual({ days: "23–26", months: "tháng 10" });
    expect(formatDayRange("2026-10-23", "2026-10-26", "en")).toEqual({ days: "23–26", months: "Oct" });
    expect(formatDayRange("2026-10-30", "2026-11-02", "vi").days).toBe("30");
    expect(formatDayRange("2026-10-30", "2026-11-02", "vi").months).toContain("2");
  });

  it("names the month of a group", () => {
    expect(monthLabel(2026, 9, "en")).toBe("October · 2026");
    expect(monthLabel(2026, 9, "vi")).toBe("tháng 10 · 2026");
  });

  it("groups the competitions by the month they start in", () => {
    const groups = groupByMonth([
      competition({ id: "a", startDate: "2026-11-04", endDate: "2026-11-04" }),
      competition({ id: "b", startDate: "2026-10-23", endDate: "2026-10-26" }),
      competition({ id: "c", startDate: "2026-10-30", endDate: "2026-11-01" }),
    ]);

    expect(groups.map((group) => group.key)).toEqual(["2026-10", "2026-11"]);
    expect(groups[0].competitions.map((entry) => entry.id)).toEqual(["b", "c"]);
    expect(groups[1].competitions).toHaveLength(1);
  });

  it("finds a competition by its name, its city, its country or its venue", () => {
    const entry = competition({ venueName: "[BOK Hall](https://bok.hu)" });

    expect(matchesQuery(entry, "hungarian")).toBe(true);
    expect(matchesQuery(entry, "budapest")).toBe(true);
    expect(matchesQuery(entry, "bok hall")).toBe(true);
    expect(matchesQuery(entry, "paris")).toBe(false);
    expect(matchesQuery(entry, "   ")).toBe(true);
  });

  it("reads the place of a competition", () => {
    expect(locationLabel(competition())).toBe("Budapest, Hungary");
    expect(locationLabel(competition({ cityName: "" }))).toBe("Hungary");
  });

  it("turns a country code into a flag", () => {
    expect(flagEmoji("HU")).toBe("🇭🇺");
    expect(flagEmoji("")).toBe("");
  });

  it("keeps the calendar day in the visitor's own time zone", () => {
    expect(toIsoDate(new Date(2026, 9, 22))).toBe("2026-10-22");
    expect(toIsoDate(addDays(new Date(2026, 9, 22), 90))).toBe("2027-01-20");
  });

  it("offers three ready-made periods and starts on the three month one", () => {
    expect(RANGE_PRESETS.map((preset) => preset.days)).toEqual([30, 90, 365]);
    expect(DEFAULT_PRESET_ID).toBe("90");
  });
});
