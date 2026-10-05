import { afterEach, describe, expect, it, vi } from "vitest";
import { clearWcaMemoryCache, getWcaCompetitions, getWcaCountries, getWcaProfile, normalizeWcaId } from "./services/wcaApi";

function mockJson(value: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => value } as Response;
}

afterEach(() => {
  clearWcaMemoryCache();
  vi.unstubAllGlobals();
});

describe("WCA public API adapter", () => {
  it("normalizes a WCA profile and 3×3 personal records", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockJson({
      person: { name: "Nguyen Cubing", wca_id: "2020NGUY01", country: { name: "Vietnam", iso2: "VN" }, url: "https://www.worldcubeassociation.org/persons/2020NGUY01", avatar: { thumb_url: "https://example.test/avatar.png" } },
      competition_count: 12,
      total_solves: 510,
      medals: { gold: 2, silver: 1, bronze: 0, total: 3 },
      records: { national: 1, continental: 0, world: 0, total: 1 },
      personal_records: { "333": { single: { best: 987, world_rank: 1_000, continent_rank: 120, country_rank: 12 }, average: { best: 1_234, world_rank: 1_200, continent_rank: 150, country_rank: 16 } } },
    })));
    const profile = await getWcaProfile("2020nguy01");
    expect(profile).toMatchObject({ wcaId: "2020NGUY01", name: "Nguyen Cubing", countryIso2: "VN", competitionCount: 12, totalSolves: 510 });
    expect(profile.personalRecords).toEqual([{ eventId: "333", singleCentiseconds: 987, averageCentiseconds: 1_234, singleRanks: { world: 1_000, continental: 120, country: 12 }, averageRanks: { world: 1_200, continental: 150, country: 16 } }]);
  });

  it("deduplicates concurrent profile requests for the same WCA ID", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJson({ person: { name: "Nguyen Cubing", wca_id: "2020NGUY01", country: { name: "Vietnam", iso2: "VN" } } }));
    vi.stubGlobal("fetch", fetchMock);
    const [first, second] = await Promise.all([getWcaProfile("2020nguy01"), getWcaProfile("2020NGUY01")]);
    expect(first).toEqual(second);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("passes the country filter to the competition endpoint and maps public fields", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(mockJson([{ id: "HanoiOpen2026", name: "Hanoi Open 2026", start_date: "2026-09-12", end_date: "2026-09-13", city: "Hanoi", venue: "Cube Hall", status: "approved", country_iso2: "VN" }]))
      .mockResolvedValueOnce(mockJson([{ id: "Vietnam", name: "Vietnam", iso2: "VN" }]));
    vi.stubGlobal("fetch", fetchMock);
    const competitions = await getWcaCompetitions({ start: "2026-09-01", end: "2026-09-30", countryIso2: "VN" });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("country_iso2=VN");
    expect(competitions[0]).toMatchObject({ id: "HanoiOpen2026", countryIso2: "VN", venueName: "Cube Hall" });
  });

  it("keeps only usable countries and validates WCA ID syntax", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockJson([{ id: "Vietnam", name: "Vietnam", iso2: "VN" }, { id: "Broken" }])));
    await expect(getWcaCountries()).resolves.toEqual([{ id: "Vietnam", name: "Vietnam", iso2: "VN" }]);
    expect(normalizeWcaId("2020nguy01")).toBe("2020NGUY01");
    expect(() => normalizeWcaId("not-a-wca-id")).toThrow("WCA ID");
  });
});
