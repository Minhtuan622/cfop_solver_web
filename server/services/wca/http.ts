import { RateLimiter, type RateLimitRule } from "../../infrastructure/rateLimit";

const WCA_API_BASE = "https://www.worldcubeassociation.org/api/v0";

type CacheEntry<T> = { expiresAt: number; value?: T; pending?: Promise<T> };
const memoryCache = new Map<string, CacheEntry<unknown>>();
export const MAX_CACHE_ENTRIES = 200;

export type WcaCallerKey = string;

export const WCA_CALLER_RATE_LIMIT: RateLimitRule = {
  limit: 30,
  windowMs: 60 * 1000,
};
export const WCA_GLOBAL_RATE_LIMIT: RateLimitRule = {
  limit: 120,
  windowMs: 60 * 1000,
};

const wcaCallerLimiter = new RateLimiter();
const wcaGlobalLimiter = new RateLimiter();

function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now && !entry.pending) memoryCache.delete(key);
  }
  while (memoryCache.size > MAX_CACHE_ENTRIES) {
    const oldest = Array.from(memoryCache.entries()).sort(
      ([, a], [, b]) => a.expiresAt - b.expiresAt
    )[0];
    if (oldest) memoryCache.delete(oldest[0]);
  }
}

export function clearWcaRateLimits() {
  wcaCallerLimiter.reset();
  wcaGlobalLimiter.reset();
}

export function wcaRateLimitBuckets() {
  return { caller: wcaCallerLimiter.size(), global: wcaGlobalLimiter.size() };
}

export async function fetchWcaJson<T>(
  path: string,
  cacheTtlMs: number,
  caller: WcaCallerKey
): Promise<T> {
  const url = `${WCA_API_BASE}${path}`;
  pruneCache();
  const cached = memoryCache.get(url) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.pending) return cached.pending;
    if (cached.value !== undefined) return cached.value;
  }
  if (cached?.pending) return cached.pending;

  if (!wcaCallerLimiter.consume(caller, WCA_CALLER_RATE_LIMIT).allowed) {
    throw new WcaApiError(
      "RATE_LIMITED",
      "Yêu cầu WCA quá nhiều. Hãy thử lại sau."
    );
  }
  if (!wcaGlobalLimiter.consume("wca", WCA_GLOBAL_RATE_LIMIT).allowed) {
    throw new WcaApiError(
      "RATE_LIMITED",
      "Dịch vụ WCA đang bận. Hãy thử lại sau."
    );
  }

  const pending = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (response.status === 404)
        throw new WcaApiError(
          "NOT_FOUND",
          "Không tìm thấy WCA ID hoặc dữ liệu WCA."
        );
      if (!response.ok)
        throw new WcaApiError(
          "UNAVAILABLE",
          "WCA hiện chưa phản hồi dữ liệu. Hãy thử lại sau."
        );
      const value = (await response.json()) as T;
      memoryCache.set(url, { value, expiresAt: Date.now() + cacheTtlMs });
      pruneCache();
      return value;
    } catch (error) {
      if (error instanceof WcaApiError) throw error;
      throw new WcaApiError(
        "UNAVAILABLE",
        "Không thể kết nối WCA lúc này. Hãy thử lại sau."
      );
    } finally {
      clearTimeout(timeout);
    }
  })();
  memoryCache.set(url, { pending, expiresAt: Number.POSITIVE_INFINITY });
  try {
    return await pending;
  } catch (error) {
    memoryCache.delete(url);
    throw error;
  }
}

export class WcaApiError extends Error {
  constructor(
    public readonly kind: "NOT_FOUND" | "UNAVAILABLE" | "RATE_LIMITED",
    message: string
  ) {
    super(message);
  }
}

export function clearWcaMemoryCache() {
  memoryCache.clear();
}
