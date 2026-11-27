import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearWcaMemoryCache,
  clearWcaRateLimits,
  competitionStatus,
  getWcaCompetitionDetail,
  getWcaMyCompetitions,
  resultRowsFor,
  scheduleItems,
  summarizeResults,
  toCompetitionInfo,
} from "./services/wcaApi";

const CALLER = "test-caller";

const competition = (id: string, start: string, end = start) => ({
  id,
  name: `Cuộc thi ${id}`,
  start_date: start,
  end_date: end,
  city: "Hà Nội, Vietnam",
  country_iso2: "VN",
  venue: "Trung tâm",
  venue_address: "1 Phố Cổ",
  venue_details: "Tầng 2",
  latitude_degrees: 21.03,
  longitude_degrees: 105.85,
  event_ids: ["333", "222", "skewb"],
  main_event_id: "333",
  registration_open: "2026-10-01T00:00:00.000Z",
  registration_close: "2026-12-01T00:00:00.000Z",
  competitor_limit: 100,
  base_entry_fee_lowest_denomination: 15000000,
  currency_code: "VND",
  url: `https://www.worldcubeassociation.org/competitions/${id}`,
  website: "https://example.test/giai",
  delegates: [{ name: "Delegate A", wca_id: "2010AAAA01", email: "secret@example.test" }],
  organizers: [{ name: "CLB Rubik", wca_id: null }],
});

const result = (id: number, competitionId: string, eventId: string, round: string, pos: number, best = 900) => ({
  id,
  competition_id: competitionId,
  event_id: eventId,
  round_type_id: round,
  pos,
  best,
  average: best + 100,
  attempts: [best, best + 50, best + 100, best + 150, best + 200],
});

function mockFetch(routes: Record<string, unknown>) {
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = String(input).replace("https://www.worldcubeassociation.org/api/v0", "");
    if (!(url in routes)) return { ok: false, status: 404, json: async () => ({}) } as Response;
    return { ok: true, status: 200, json: async () => routes[url] } as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  clearWcaMemoryCache();
  clearWcaRateLimits();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("WCA my competitions", () => {
  it("copies delegate and organizer names without e-mail addresses", () => {
    const info = toCompetitionInfo(competition("HanoiOpen2026", "2026-12-12"));
    expect(info.delegates).toEqual([{ name: "Delegate A", wcaId: "2010AAAA01" }]);
    expect(JSON.stringify(info)).not.toContain("secret@example.test");
    expect(info.organizers).toEqual([{ name: "CLB Rubik", wcaId: null }]);
    expect(info.entryFee).toEqual({ lowestDenomination: 15000000, currency: "VND" });
    expect(info.liveUrl).toBe("https://live.worldcubeassociation.org/link/competitions/HanoiOpen2026");
    expect(info.website).toBe("https://example.test/giai");
  });

  it("classifies a competition as past, ongoing or upcoming", () => {
    expect(competitionStatus({ startDate: "2026-01-01", endDate: "2026-01-02" }, "2026-02-01")).toBe("past");
    expect(competitionStatus({ startDate: "2026-02-01", endDate: "2026-02-02" }, "2026-02-02")).toBe("ongoing");
    expect(competitionStatus({ startDate: "2026-03-01", endDate: "2026-03-02" }, "2026-02-02")).toBe("upcoming");
  });

  it("summarizes results per competition, newest first, counting final podiums", () => {
    const rows = [
      result(10, "Old2020", "333", "f", 1),
      result(11, "Old2020", "222", "1", 3),
      result(50, "New2025", "333", "1", 5),
      result(51, "New2025", "333", "f", 3),
      result(52, "New2025", "skewb", "c", 2),
      result(53, "New2025", "444", "f", 7),
    ];
    const summaries = summarizeResults(rows);
    expect(summaries.map(item => item.competitionId)).toEqual(["New2025", "Old2020"]);
    expect(summaries[0]).toMatchObject({ events: 3, rounds: 4, podiums: 2 });
    expect(summaries[1]).toMatchObject({ events: 2, rounds: 2, podiums: 1 });
    expect(resultRowsFor(rows, "New2025").map(row => `${row.eventId}-${row.roundTypeId}`)).toEqual([
      "333-1",
      "333-f",
      "444-f",
      "skewb-c",
    ]);
  });

  it("flattens the schedule into timed rounds", () => {
    const items = scheduleItems({
      venues: [
        {
          timezone: "Asia/Ho_Chi_Minh",
          rooms: [
            {
              name: "Phòng A",
              activities: [
                { name: "3x3x3 Cube, Round 1", activityCode: "333-r1", startTime: "2026-12-12T03:00:00Z", endTime: "2026-12-12T04:00:00Z" },
                { name: "Ăn trưa", activityCode: "other-lunch", startTime: "2026-12-12T05:00:00Z", endTime: "2026-12-12T06:00:00Z" },
                { name: "Thiếu giờ", activityCode: "222-r1" },
              ],
            },
          ],
        },
      ],
    });
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ eventId: "333", round: 1, room: "Phòng A", timezone: "Asia/Ho_Chi_Minh" });
    expect(items[1]).toMatchObject({ eventId: null, round: null, code: "other-lunch" });
  });

  it("lists upcoming and past competitions for a WCA ID", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-12-12T08:00:00Z"));
    mockFetch({
      "/users/2020NGUY01?upcoming_competitions=true": {
        user: { id: 777 },
        upcoming_competitions: [
          competition("Later2027", "2027-02-01"),
          competition("Today2026", "2026-12-12", "2026-12-13"),
        ],
      },
      "/persons/2020NGUY01/results": [
        result(10, "Old2020", "333", "f", 1),
        result(50, "New2025", "333", "1", 5),
      ],
      "/competitions/Old2020": competition("Old2020", "2020-05-01"),
      "/competitions/New2025": competition("New2025", "2025-05-01"),
    });
    const mine = await getWcaMyCompetitions("2020nguy01", CALLER);
    expect(mine.upcoming.map(item => `${item.competition.id}:${item.status}`)).toEqual([
      "Today2026:ongoing",
      "Later2027:upcoming",
    ]);
    expect(mine.past.total).toBe(2);
    expect(mine.past.items.map(item => item.competition.id)).toEqual(["New2025", "Old2020"]);
    expect(mine.past.items[1].summary?.podiums).toBe(1);
  });

  it("returns the schedule, registered events and results for one competition", async () => {
    mockFetch({
      "/competitions/Hanoi2026": competition("Hanoi2026", "2026-12-12"),
      "/competitions/Hanoi2026/schedule": {
        venues: [{ timezone: "Asia/Ho_Chi_Minh", rooms: [{ name: "A", activities: [{ name: "3x3x3", activityCode: "333-r1", startTime: "2026-12-12T03:00:00Z", endTime: "2026-12-12T04:00:00Z" }] }] }],
      },
      "/competitions/Hanoi2026/registrations": [
        { user_id: 1, event_ids: ["444"] },
        { user_id: 777, event_ids: ["333", "skewb"] },
      ],
      "/persons/2020NGUY01/results": [result(60, "Hanoi2026", "333", "f", 2)],
      "/users/2020NGUY01?upcoming_competitions=true": { user: { id: 777 }, upcoming_competitions: [] },
    });
    const detail = await getWcaCompetitionDetail("2020NGUY01", "Hanoi2026", CALLER);
    expect(detail.registeredEventIds).toEqual(["333", "skewb"]);
    expect(detail.schedule).toHaveLength(1);
    expect(detail.results).toHaveLength(1);
    expect(detail.competition.venueAddress).toBe("1 Phố Cổ");
  });

  it("still returns a detail when the schedule or registrations are missing", async () => {
    mockFetch({
      "/competitions/Quiet2026": competition("Quiet2026", "2026-12-12"),
      "/persons/2020NGUY01/results": [],
      "/users/2020NGUY01?upcoming_competitions=true": { user: { id: 777 }, upcoming_competitions: [] },
    });
    const detail = await getWcaCompetitionDetail("2020NGUY01", "Quiet2026", CALLER);
    expect(detail.schedule).toEqual([]);
    expect(detail.registeredEventIds).toBeNull();
  });
});
