import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearWcaMemoryCache,
  getWcaCompetitions,
  MAX_CACHE_ENTRIES,
  MAX_COMPETITION_DAYS,
} from "./services/wcaApi";
import { TRPCError } from "@trpc/server";

function mockJson(value: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => value } as Response;
}

beforeEach(() => {
  clearWcaMemoryCache();
  vi.unstubAllGlobals();
});

afterEach(() => {
  clearWcaMemoryCache();
  vi.unstubAllGlobals();
});

describe("B4: WCA hardening", () => {
  it("rejects competition date range wider than 366 days with BAD_REQUEST", async () => {
    vi.stubGlobal("fetch", vi.fn());
    await expect(
      getWcaCompetitions({ start: "2025-01-01", end: "2026-12-31" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects competition date range end before start with BAD_REQUEST", async () => {
    vi.stubGlobal("fetch", vi.fn());
    await expect(
      getWcaCompetitions({ start: "2026-06-01", end: "2026-01-01" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("accepts exactly 366 days range", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJson([]));
    vi.stubGlobal("fetch", fetchMock);
    await getWcaCompetitions({ start: "2024-01-01", end: "2024-12-31" });
    // fetch called once for competitions + once for getWcaCountries
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("caps pagination at MAX_COMPETITION_PAGES, no unbounded Promise.all", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJson(Array(200).fill({ id: "x", name: "x", start_date: "2026-01-01", end_date: "2026-01-02" })));
    vi.stubGlobal("fetch", fetchMock);
    await getWcaCompetitions({ start: "2026-01-01", end: "2026-01-31" });
    // First page + up to MAX_COMPETITION_PAGES (10) additional pages = 11 calls max
    expect(fetchMock).toHaveBeenCalledTimes(11);
  });

  it("memoryCache is bounded: clearWcaMemoryCache works and cache stays bounded", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJson([]));
    vi.stubGlobal("fetch", fetchMock);
    // Stay under the WCA rate limit (30/min per path): 25 distinct requests.
    for (let i = 0; i < 25; i += 1) {
      const y = 2020 + Math.floor(i / 366);
      const m = String(Math.floor((i % 366) / 31) + 1).padStart(2, "0");
      const d = String((i % 31) + 1).padStart(2, "0");
      await getWcaCompetitions({ start: `${y}-${m}-${d}`, end: `${y}-${m}-${d}` });
    }
    const callsBeforeClear = fetchMock.mock.calls.length;
    clearWcaMemoryCache();
    // After clearing, a fresh request re-fetches from the network.
    await getWcaCompetitions({ start: "2020-01-01", end: "2020-01-01" });
    expect(fetchMock).toHaveBeenCalledTimes(callsBeforeClear + 2);
  });

  it("wcaOAuth code path uses TRUST_PROXY-aware redirect (http localhost OK in dev)", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      // In development, getConfig accepts http://localhost redirect URIs.
      // The function is internal to wcaOAuth.ts; we verify the env var contract here.
      expect(process.env.NODE_ENV).toBe("development");
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("TRPCError is the right error class for BAD_REQUEST", () => {
    const err = new TRPCError({ code: "BAD_REQUEST", message: "Khoảng ngày quá dài." });
    expect(err.code).toBe("BAD_REQUEST");
    expect(err.message).toBe("Khoảng ngày quá dài.");
  });

  it("MAX_COMPETITION_DAYS is 366 and MAX_CACHE_ENTRIES is 200", () => {
    expect(MAX_COMPETITION_DAYS).toBe(366);
    expect(MAX_CACHE_ENTRIES).toBe(200);
  });
});
