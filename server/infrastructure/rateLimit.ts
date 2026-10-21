/**
 * Fixed-window rate limiter for the unauthenticated auth endpoints.
 *
 * The app ships a single node, so an in-process counter is enough to blunt
 * brute force and credential stuffing. It deliberately reuses the shape of
 * `TtlCache` in this folder: no new dependency, no shared state to operate.
 */
export type RateLimitRule = {
  /** Maximum number of allowed requests inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Milliseconds until the window resets. */
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

  /**
   * Counts one attempt against `key` and reports whether it fits in the window.
   * Rejected attempts do not extend the window, so a caller cannot push the
   * reset time further away by hammering the endpoint.
   */
  consume(key: string, rule: RateLimitRule, now = Date.now()): RateLimitResult {
    const bucket = this.buckets.get(key);
    const active = bucket && bucket.resetAt > now ? bucket : undefined;

    if (!active) {
      const fresh: Bucket = { count: 1, resetAt: now + rule.windowMs };
      this.buckets.set(key, fresh);
      this.evictIfNeeded(now);
      return { allowed: true, remaining: Math.max(0, rule.limit - 1), retryAfterMs: rule.windowMs, limit: rule.limit };
    }

    active.count += 1;
    if (active.count > rule.limit) {
      return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, active.resetAt - now), limit: rule.limit };
    }

    return { allowed: true, remaining: Math.max(0, rule.limit - active.count), retryAfterMs: Math.max(0, active.resetAt - now), limit: rule.limit };
  }

  /** Reports the current state of `key` without counting an attempt. */
  peek(key: string, rule: RateLimitRule, now = Date.now()): RateLimitResult {
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      return { allowed: true, remaining: rule.limit, retryAfterMs: rule.windowMs, limit: rule.limit };
    }
    return {
      // The bucket is full once it holds `limit` attempts: the next one is rejected.
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

  private evictIfNeeded(now: number) {
    if (this.buckets.size <= this.maxBuckets) return;
    for (const [key, bucket] of Array.from(this.buckets.entries())) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
    // Everything is still live: drop the oldest reset so the map stays bounded.
    while (this.buckets.size > this.maxBuckets) {
      const oldest = Array.from(this.buckets.entries()).sort(([, left], [, right]) => left.resetAt - right.resetAt)[0];
      if (!oldest) return;
      this.buckets.delete(oldest[0]);
    }
  }
}

/**
 * Resolves the client address used as a rate limit key.
 *
 * The app runs behind Railway's proxy, so the real client address only shows
 * up in `x-forwarded-for`. The header is read as a chain and the **right most**
 * hop is used: a proxy appends the address it observed, so that entry is the
 * one a client cannot forge. The left most entry is whatever the client sent
 * and would let an attacker mint a fresh bucket per request.
 *
 * The forwarded header is only trusted while the request arrives from a
 * private peer address, which is what the proxy looks like from inside the
 * network. A request that reaches the app straight from the public internet
 * is keyed on its socket address instead.
 */
export function clientAddress(req: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }): string {
  const remote = req.socket?.remoteAddress?.trim();

  if (remote && !isPrivateAddress(remote)) return remote;

  const forwarded = req.headers["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (value) {
    const hops = value.split(",").map((hop) => hop.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }

  return remote || "unknown";
}

/** Tells whether an address belongs to a private or loopback range. */
function isPrivateAddress(address: string): boolean {
  const value = address.trim().toLowerCase();
  if (value === "::1") return true;
  if (value.startsWith("::ffff:")) return isPrivateAddress(value.slice(7));
  if (value.startsWith("fc") || value.startsWith("fd")) return true;
  if (value.startsWith("fe80:")) return true;
  if (value.startsWith("10.")) return true;
  if (value.startsWith("192.168.")) return true;
  if (value.startsWith("169.254.")) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(value)) return true;
  return false;
}
