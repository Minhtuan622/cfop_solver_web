import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearWcaMemoryCache,
  clearWcaRateLimits,
  getWcaCompetitions,
  getWcaCountries,
  getWcaProfile,
  getWcaRecentRecords,
  getWcaRecords,
  normalizeRecentRecords,
  normalizeWcaId,
} from "./services/wcaApi";

const CALLER = "test-caller";

function mockJson(value: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => value,
  } as Response;
}

afterEach(() => {
  clearWcaMemoryCache();
  clearWcaRateLimits();
  vi.unstubAllGlobals();
});

describe("WCA public API adapter", () => {
  it("normalizes a WCA profile and 3×3 personal records", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockJson({
          person: {
            name: "Nguyen Cubing",
            wca_id: "2020NGUY01",
            country: { name: "Vietnam", iso2: "VN" },
            url: "https://www.worldcubeassociation.org/persons/2020NGUY01",
            avatar: { thumb_url: "https://example.test/avatar.png" },
          },
          competition_count: 12,
          total_solves: 510,
          medals: { gold: 2, silver: 1, bronze: 0, total: 3 },
          records: { national: 1, continental: 0, world: 0, total: 1 },
          personal_records: {
            "333": {
              single: {
                best: 987,
                world_rank: 1_000,
                continent_rank: 120,
                country_rank: 12,
              },
              average: {
                best: 1_234,
                world_rank: 1_200,
                continent_rank: 150,
                country_rank: 16,
              },
            },
          },
        })
      )
    );
    const profile = await getWcaProfile("2020nguy01", CALLER);
    expect(profile).toMatchObject({
      wcaId: "2020NGUY01",
      name: "Nguyen Cubing",
      countryIso2: "VN",
      competitionCount: 12,
      totalSolves: 510,
    });
    expect(profile.personalRecords).toEqual([
      {
        eventId: "333",
        singleCentiseconds: 987,
        averageCentiseconds: 1_234,
        singleRanks: { world: 1_000, continental: 120, country: 12 },
        averageRanks: { world: 1_200, continental: 150, country: 16 },
      },
    ]);
  });

  it("deduplicates concurrent profile requests for the same WCA ID", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        mockJson({
          person: {
            name: "Nguyen Cubing",
            wca_id: "2020NGUY01",
            country: { name: "Vietnam", iso2: "VN" },
          },
        })
      );
    vi.stubGlobal("fetch", fetchMock);
    const [first, second] = await Promise.all([
      getWcaProfile("2020nguy01", CALLER),
      getWcaProfile("2020NGUY01", CALLER),
    ]);
    expect(first).toEqual(second);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("passes the country filter to the competition endpoint and maps public fields", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        mockJson([
          {
            id: "HanoiOpen2026",
            name: "Hanoi Open 2026",
            start_date: "2026-09-12",
            end_date: "2026-09-13",
            city: "Hanoi",
            venue: "Cube Hall",
            status: "approved",
            country_iso2: "VN",
            event_ids: ["333", "222", "444"],
          },
        ])
      )
      .mockResolvedValueOnce(
        mockJson([{ id: "Vietnam", name: "Vietnam", iso2: "VN" }])
      );
    vi.stubGlobal("fetch", fetchMock);
    const competitions = await getWcaCompetitions(
      { start: "2026-09-01", end: "2026-09-30", countryIso2: "VN" },
      CALLER
    );
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("country_iso2=VN");
    expect(competitions[0]).toMatchObject({
      id: "HanoiOpen2026",
      countryIso2: "VN",
      venueName: "Cube Hall",
      eventIds: ["333", "222", "444"],
    });
  });

  it("keeps only usable countries and validates WCA ID syntax", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          mockJson([
            { id: "Vietnam", name: "Vietnam", iso2: "VN" },
            { id: "Broken" },
          ])
        )
    );
    await expect(getWcaCountries(CALLER)).resolves.toEqual([
      { id: "Vietnam", name: "Vietnam", iso2: "VN" },
    ]);
    expect(normalizeWcaId("2020nguy01")).toBe("2020NGUY01");
    expect(() => normalizeWcaId("not-a-wca-id")).toThrow("WCA ID");
  });

  it("returns world, continental and national records in the order the WCA lists them", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/countries"))
        return mockJson([{ id: "Vietnam", name: "Vietnam", iso2: "VN" }]);
      return mockJson({
        world_records: {
          "333mbf": { single: 380350302 },
          magic: { single: 69, average: 76 },
          "222": { single: 39, average: 86 },
          "333": { single: 251, average: 351 },
          "333fm": { single: 16, average: 1900 },
          "333ft": { single: 1556, average: 1990 },
        },
        continental_records: {
          _Asia: { "333": { single: 301, average: 401 } },
          _Empty: {},
        },
        national_records: {
          Vietnam: { "333": { single: 358, average: 559 }, "222": { single: 83, average: 147 } },
          Atlantis: { "333": { single: 999, average: null } },
        },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const records = await getWcaRecords(CALLER);
    const again = await getWcaRecords(CALLER);

    expect(again).toEqual(records);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/records"))).toHaveLength(1);
    expect(records.world).toEqual([
      { eventId: "333", single: 251, average: 351 },
      { eventId: "222", single: 39, average: 86 },
      { eventId: "333fm", single: 16, average: 1900 },
      { eventId: "333mbf", single: 380350302, average: null },
    ]);
    expect(records.continents).toEqual([
      { id: "_Asia", name: "Asia", records: [{ eventId: "333", single: 301, average: 401 }] },
    ]);
    expect(records.countries.map(country => [country.name, country.iso2])).toEqual([
      ["Atlantis", null],
      ["Vietnam", "VN"],
    ]);
    expect(records.countries[1].records.map(record => record.eventId)).toEqual(["333", "222"]);
  });

  it("normalizes the records WCA Live reports, newest first, and drops broken rows", () => {
    const record = (overrides: Record<string, unknown>) => ({
      tag: "NR",
      type: "single",
      attemptResult: 905,
      result: {
        enteredAt: "2026-11-20T10:00:00Z",
        person: { name: "Nguyễn A", wcaId: "2020NGUY01", country: { iso2: "VN" } },
        round: { competitionEvent: { event: { id: "333" }, competition: { name: "Hanoi Open", wcaId: "HanoiOpen2026" } } },
      },
      ...overrides,
    });
    const rows = normalizeRecentRecords({
      recentRecords: [
        record({}),
        record({ tag: "WR", attemptResult: 251, result: { enteredAt: "2026-11-22T10:00:00Z", person: { name: "B", wcaId: null, country: null }, round: { competitionEvent: { event: { id: "222" }, competition: null } } } }),
        record({ tag: "XX" }),
        record({ attemptResult: 0 }),
        record({ type: "other" }),
      ],
    });
    expect(rows.map(row => [row.tag, row.eventId, row.competitionId])).toEqual([
      ["WR", "222", null],
      ["NR", "333", "HanoiOpen2026"],
    ]);
    expect(rows[1]).toMatchObject({ personName: "Nguyễn A", countryIso2: "VN", wcaId: "2020NGUY01", attemptResult: 905 });
    expect(normalizeRecentRecords({})).toEqual([]);
  });

  it("asks WCA Live over GraphQL for recent records and caches the answer", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJson({ data: { recentRecords: [] } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(getWcaRecentRecords(CALLER)).resolves.toEqual([]);
    await getWcaRecentRecords(CALLER);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(String(init.body)).toContain("recentRecords");
  });

  it("treats a GraphQL error from WCA Live as unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockJson({ errors: [{ message: "schema changed" }] })));
    await expect(getWcaRecentRecords(CALLER)).rejects.toMatchObject({ kind: "UNAVAILABLE" });
  });
});
