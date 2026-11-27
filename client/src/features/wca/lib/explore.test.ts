import { describe, expect, it } from "vitest";
import {
  defaultCountry,
  delegateCountries,
  distanceLabel,
  filterDelegates,
  groupActivitiesByDay,
  isPodiumRound,
  parseActivityCode,
  podiumRows,
  type Delegate,
  type ResultRound,
} from "./explore";

const delegate = (name: string, status: string, countryIso2: string, location: string | null = null): Delegate => ({
  wcaId: null,
  name,
  status,
  location,
  countryIso2,
  countryName: countryIso2 === "VN" ? "Vietnam" : "Poland",
  avatarUrl: null,
  profileUrl: "",
});

describe("explore helpers", () => {
  it("parses activity codes", () => {
    expect(parseActivityCode("333-r1-g2")).toEqual({ eventId: "333", round: 1, group: 2, attempt: null });
    expect(parseActivityCode("333fm-r1-a2").attempt).toBe(2);
    expect(parseActivityCode("other-lunch").eventId).toBeNull();
  });

  it("groups activities by the day at the venue", () => {
    const days = groupActivitiesByDay([
      { startTime: "2027-01-02T20:00:00Z", timezone: "Asia/Bangkok" },
      { startTime: "2027-01-02T03:00:00Z", timezone: "Asia/Bangkok" },
    ]);
    expect(days.map(day => day.date)).toEqual(["2027-01-02", "2027-01-03"]);
  });

  it("finds podium rows only in final rounds", () => {
    const rows = [1, 2, 3, 4].map(pos => ({
      pos,
      name: `P${pos}`,
      wcaId: null,
      countryIso2: "VN",
      best: pos === 3 ? -1 : 500 + pos,
      average: null,
      attempts: [],
      singleRecord: null,
      averageRecord: null,
    }));
    const round: ResultRound = { roundTypeId: "f", formatId: "a", rows };
    expect(isPodiumRound(round)).toBe(true);
    expect(isPodiumRound({ roundTypeId: "1" })).toBe(false);
    expect(podiumRows(round).map(row => row.name)).toEqual(["P1", "P2"]);
  });

  it("formats distances", () => {
    expect(distanceLabel(null)).toBeNull();
    expect(distanceLabel(0)).toBe("<1 km");
    expect(distanceLabel(1234)).toBe("1,234 km");
  });

  it("filters and orders delegates", () => {
    const list = [
      delegate("Zed", "junior_delegate", "VN"),
      delegate("Amy", "senior_delegate", "VN", "Hanoi"),
      delegate("Bob", "delegate", "PL"),
    ];
    expect(filterDelegates(list, "", "VN").map(item => item.name)).toEqual(["Amy", "Zed"]);
    expect(filterDelegates(list, "hanoi", "").map(item => item.name)).toEqual(["Amy"]);
    expect(delegateCountries(list).map(item => item.iso2)).toEqual(["PL", "VN"]);
  });

  it("picks a default country", () => {
    expect(defaultCountry("vi", null)).toBe("VN");
    expect(defaultCountry("en", null)).toBe("US");
    expect(defaultCountry("vi", "PL")).toBe("PL");
  });
});
