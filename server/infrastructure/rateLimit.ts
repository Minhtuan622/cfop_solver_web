export type RateLimitRule = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  limit: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly maxBuckets = 10_000) {}

  consume(key: string, rule: RateLimitRule, now = Date.now()): RateLimitResult {
    const bucket = this.buckets.get(key);
    const active = bucket && bucket.resetAt > now ? bucket : undefined;

    if (!active) {
      const fresh: Bucket = { count: 1, resetAt: now + rule.windowMs };
      this.buckets.set(key, fresh);
      this.evictIfNeeded(now);
      return {
        allowed: true,
        remaining: Math.max(0, rule.limit - 1),
        retryAfterMs: rule.windowMs,
        limit: rule.limit,
      };
    }

    active.count += 1;
    if (active.count > rule.limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, active.resetAt - now),
        limit: rule.limit,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, rule.limit - active.count),
      retryAfterMs: Math.max(0, active.resetAt - now),
      limit: rule.limit,
    };
  }

  peek(key: string, rule: RateLimitRule, now = Date.now()): RateLimitResult {
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      return {
        allowed: true,
        remaining: rule.limit,
        retryAfterMs: rule.windowMs,
        limit: rule.limit,
      };
    }
    return {
      allowed: bucket.count < rule.limit,
      remaining: Math.max(0, rule.limit - bucket.count),
      retryAfterMs: Math.max(0, bucket.resetAt - now),
      limit: rule.limit,
    };
  }

  reset(key?: string) {
    if (key === undefined) this.buckets.clear();
    else this.buckets.delete(key);
  }

  size(): number {
    return this.buckets.size;
  }

  private evictIfNeeded(now: number) {
    for (const [key, bucket] of Array.from(this.buckets.entries())) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
    if (this.buckets.size <= this.maxBuckets) return;
    while (this.buckets.size > this.maxBuckets) {
      const oldest = Array.from(this.buckets.entries()).sort(
        ([, left], [, right]) => left.resetAt - right.resetAt
      )[0];
      if (!oldest) return;
      this.buckets.delete(oldest[0]);
    }
  }
}

export function clientAddress(
  req: {
    headers: Record<string, string | string[] | undefined>;
    socket?: { remoteAddress?: string };
    ip?: string;
  },
  trustProxy = false
): string {
  if (trustProxy) {
    const forwarded = req.headers["x-forwarded-for"];
    const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    if (value) {
      const hops = value
        .split(",")
        .map(hop => hop.trim())
        .filter(Boolean);
      if (hops.length) return hops[hops.length - 1];
    }
    const ip = typeof req.ip === "string" ? req.ip.trim() : "";
    if (ip) return ip;
  }
  const remote = req.socket?.remoteAddress?.trim();
  return remote || "unknown";
}
