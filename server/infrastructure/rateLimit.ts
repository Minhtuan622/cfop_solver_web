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

  /** Reports the current state of `key` without counting an attempt. */
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

  /** Số bucket đang theo dõi (dùng cho kiểm thử và chẩn đoán). */
  size(): number {
    return this.buckets.size;
  }

  private evictIfNeeded(now: number) {
    // Dọn mục hết hạn trước: bảng đếm không giữ lại dữ liệu của các cửa sổ
    // đã qua. Một bucket hết hạn vốn đã được xem là mới, nên việc dọn này
    // không đổi hành vi, chỉ giữ bảng đếm gọn.
    for (const [key, bucket] of Array.from(this.buckets.entries())) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
    if (this.buckets.size <= this.maxBuckets) return;
    // Everything is still live: drop the oldest reset so the map stays bounded.
    while (this.buckets.size > this.maxBuckets) {
      const oldest = Array.from(this.buckets.entries()).sort(
        ([, left], [, right]) => left.resetAt - right.resetAt
      )[0];
      if (!oldest) return;
      this.buckets.delete(oldest[0]);
    }
  }
}

/**
 * Địa chỉ client dùng làm khóa hạn mức.
 *
 * `X-Forwarded-For` do chính client gửi lên nên chỉ đáng tin khi máy chủ
 * đứng sau một proxy đã được cấu hình (`TRUST_PROXY`). Khi proxy được tin,
 * lấy **hop cuối cùng** của chuỗi: đó là địa chỉ mà proxy vừa ghi vào, không
 * thể giả. Hop đầu là do client tự gửi nên không dùng.
 *
 * Khi proxy không được tin, chỉ dùng địa chỉ socket: nếu vẫn đọc
 * `X-Forwarded-For` thì kẻ gọi chỉ cần đổi header là thoát hạn mức, và sau
 * một reverse proxy mọi người dùng sẽ dùng chung một hạn mức.
 *
 * @param trustProxy có tin `X-Forwarded-*` hay không (xem `TRUST_PROXY`).
 */
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
