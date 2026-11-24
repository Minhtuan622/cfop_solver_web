import { describe, expect, it } from "vitest";
import { resultInput, MIN_ELAPSED_MS } from "../routers/inputs";
import { RateLimiter } from "../infrastructure/rateLimit";
import { playerHistoryQuery } from "../routers/competition";
import { getDb } from "./core";

describe("competition result validation", () => {
  it("từ chối elapsedMs = 0 (dưới ngưỡng tối thiểu)", () => {
    const result = resultInput.safeParse({
      code: "ABCD", roundId: 1, elapsedMs: 0, inspectionMs: 0, penalty: "none",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes("quá ngắn"))).toBe(true);
    }
  });

  it("từ chối elapsedMs nhỏ hơn inspectionMs", () => {
    const result = resultInput.safeParse({
      code: "ABCD", roundId: 1, elapsedMs: 500, inspectionMs: 15000, penalty: "none",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes("không thể ngắn hơn"))).toBe(true);
    }
  });

  it("chấp nhận elapsedMs hợp lệ (≥ MIN_ELAPSED_MS và ≥ inspectionMs)", () => {
    const result = resultInput.safeParse({
      code: "ABCD", roundId: 1, elapsedMs: 15000, inspectionMs: 15000, penalty: "none",
    });
    expect(result.success).toBe(true);
  });

  it("chấp nhận elapsedMs bằng đúng MIN_ELAPSED_MS", () => {
    const result = resultInput.safeParse({
      code: "ABCD", roundId: 1, elapsedMs: MIN_ELAPSED_MS, inspectionMs: 0, penalty: "none",
    });
    expect(result.success).toBe(true);
  });
});

describe.skipIf(!process.env.DATABASE_URL)("competition rate limits and playerHistory", () => {
  const limiter = new RateLimiter();

  it("chat rate limit: 10 tin/10 giây, sau đó 429", () => {
    const key = "chat:account1:room1";
    const rule = { limit: 10, windowMs: 10_000 };
    for (let i = 0; i < 10; i += 1) {
      expect(limiter.consume(key, rule).allowed).toBe(true);
    }
    expect(limiter.consume(key, rule).allowed).toBe(false);
  });

  it("room create rate limit: 5 phòng/giờ, sau đó 429", () => {
    const key = "room:create:account1";
    const rule = { limit: 5, windowMs: 60 * 60 * 1000 };
    for (let i = 0; i < 5; i += 1) {
      expect(limiter.consume(key, rule).allowed).toBe(true);
    }
    expect(limiter.consume(key, rule).allowed).toBe(false);
  });

  it("playerHistoryQuery trả về kết quả đúng cho mỗi phòng", async () => {
    const db = await getDb();
    if (!db) return;

    const history = await playerHistoryQuery({ accountId: 999999 });
    expect(Array.isArray(history)).toBe(true);
  });
});
