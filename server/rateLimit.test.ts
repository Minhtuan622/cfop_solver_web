import { describe, expect, it } from "vitest";
import { clientAddress, RateLimiter } from "./infrastructure/rateLimit";

describe("RateLimiter", () => {
  it("allows requests inside the window and rejects the one past the limit", () => {
    const limiter = new RateLimiter();
    const rule = { limit: 3, windowMs: 1_000 };

    expect(limiter.consume("key", rule, 0).allowed).toBe(true);
    expect(limiter.consume("key", rule, 10).allowed).toBe(true);
    expect(limiter.consume("key", rule, 20).allowed).toBe(true);

    const blocked = limiter.consume("key", rule, 30);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBe(970);
  });

  it("starts a fresh window once the previous one expires", () => {
    const limiter = new RateLimiter();
    const rule = { limit: 1, windowMs: 100 };

    expect(limiter.consume("key", rule, 0).allowed).toBe(true);
    expect(limiter.consume("key", rule, 50).allowed).toBe(false);
    expect(limiter.consume("key", rule, 150).allowed).toBe(true);
  });

  it("does not extend the window when a blocked attempt arrives", () => {
    const limiter = new RateLimiter();
    const rule = { limit: 1, windowMs: 1_000 };

    limiter.consume("key", rule, 0);
    expect(limiter.consume("key", rule, 500).allowed).toBe(false);
    expect(limiter.consume("key", rule, 900).allowed).toBe(false);
    // The window still ends at 1000, not later.
    expect(limiter.consume("key", rule, 1_000).allowed).toBe(true);
  });

  it("tracks each key independently", () => {
    const limiter = new RateLimiter();
    const rule = { limit: 1, windowMs: 1_000 };

    expect(limiter.consume("a", rule, 0).allowed).toBe(true);
    expect(limiter.consume("b", rule, 0).allowed).toBe(true);
    expect(limiter.consume("a", rule, 10).allowed).toBe(false);
    expect(limiter.consume("b", rule, 10).allowed).toBe(false);
  });

  it("reports the remaining budget without counting an attempt", () => {
    const limiter = new RateLimiter();
    const rule = { limit: 2, windowMs: 1_000 };

    expect(limiter.peek("key", rule, 0).remaining).toBe(2);
    limiter.consume("key", rule, 0);
    expect(limiter.peek("key", rule, 0).remaining).toBe(1);
    limiter.consume("key", rule, 0);
    expect(limiter.peek("key", rule, 0).allowed).toBe(false);
    expect(limiter.peek("key", rule, 0).remaining).toBe(0);
  });

  it("resets a single key or the whole limiter", () => {
    const limiter = new RateLimiter();
    const rule = { limit: 1, windowMs: 1_000 };

    limiter.consume("a", rule, 0);
    limiter.consume("b", rule, 0);
    limiter.reset("a");
    expect(limiter.consume("a", rule, 10).allowed).toBe(true);
    expect(limiter.consume("b", rule, 10).allowed).toBe(false);

    limiter.reset();
    expect(limiter.consume("b", rule, 20).allowed).toBe(true);
  });

  it("evicts expired buckets and stays bounded when every bucket is live", () => {
    const limiter = new RateLimiter(3);
    const rule = { limit: 5, windowMs: 100 };

    limiter.consume("a", rule, 0);
    limiter.consume("b", rule, 0);
    limiter.consume("c", rule, 0);
    limiter.consume("d", rule, 0);
    expect(limiter.consume("a", rule, 0).allowed).toBe(true);
  });
});

describe("clientAddress", () => {
  const proxied = { socket: { remoteAddress: "10.0.0.1" } };

  it("uses the forwarded hop when the request comes from a private peer", () => {
    expect(clientAddress({ ...proxied, headers: { "x-forwarded-for": "203.0.113.7" } })).toBe("203.0.113.7");
  });

  it("takes the right most hop so a forged chain cannot mint a new bucket", () => {
    expect(clientAddress({ ...proxied, headers: { "x-forwarded-for": "1.1.1.1, 198.51.100.2" } })).toBe("198.51.100.2");
  });

  it("ignores the forwarded header when the request arrives from the public internet", () => {
    const direct = { socket: { remoteAddress: "198.51.100.9" }, headers: { "x-forwarded-for": "203.0.113.7" } };
    expect(clientAddress(direct)).toBe("198.51.100.9");
  });

  it("falls back to the socket address when the header is missing or empty", () => {
    expect(clientAddress({ ...proxied, headers: {} })).toBe("10.0.0.1");
    expect(clientAddress({ ...proxied, headers: { "x-forwarded-for": "  " } })).toBe("10.0.0.1");
  });

  it("falls back to unknown when there is neither a header nor a socket", () => {
    expect(clientAddress({ headers: {} })).toBe("unknown");
  });

  it("reads the first entry when the header arrives as an array", () => {
    expect(clientAddress({ ...proxied, headers: { "x-forwarded-for": ["203.0.113.7"] } })).toBe("203.0.113.7");
  });

  it("treats an IPv4 mapped IPv6 peer as private", () => {
    const mapped = { socket: { remoteAddress: "::ffff:10.0.0.1" }, headers: { "x-forwarded-for": "203.0.113.7" } };
    expect(clientAddress(mapped)).toBe("203.0.113.7");
  });
});
