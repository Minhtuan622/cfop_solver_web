import { describe, expect, it, vi } from "vitest";
import { TtlCache, cacheKey } from "./cache";

describe("TtlCache", () => {
  it("deduplicates concurrent loads and reuses the value until expiry", async () => {
    const cache = new TtlCache<string>({ ttlMs: 1_000 });
    const load = vi.fn(async () => "leaderboard");
    const [first, second] = await Promise.all([
      cache.getOrSet(cacheKey(["leaderboard", "week", null]), load),
      cache.getOrSet(cacheKey(["leaderboard", "week", null]), load),
    ]);
    expect(first).toBe("leaderboard");
    expect(second).toBe("leaderboard");
    expect(load).toHaveBeenCalledTimes(1);
    await cache.getOrSet(cacheKey(["leaderboard", "week", null]), load);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("does not retain failed loads and expires entries", async () => {
    const cache = new TtlCache<string>({ ttlMs: 5 });
    const failing = vi.fn().mockRejectedValueOnce(new Error("upstream"));
    await expect(cache.getOrSet("wca", failing)).rejects.toThrow("upstream");
    await expect(cache.getOrSet("wca", async () => "fresh")).resolves.toBe("fresh");
    await new Promise((resolve) => setTimeout(resolve, 10));
    await expect(cache.getOrSet("wca", async () => "refreshed")).resolves.toBe("refreshed");
  });
});
