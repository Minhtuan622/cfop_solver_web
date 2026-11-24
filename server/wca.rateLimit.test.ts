import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./services/wcaApi", async () => {
  const actual =
    await vi.importActual<typeof import("./services/wcaApi")>(
      "./services/wcaApi"
    );
  return { ...actual, getWcaCountries: vi.fn(async () => []) };
});

import { appRouter } from "./routers";
import {
  clearWcaMemoryCache,
  clearWcaRateLimits,
  getWcaCompetitions,
  WCA_CALLER_RATE_LIMIT,
  WCA_GLOBAL_RATE_LIMIT,
} from "./services/wcaApi";

function mockJson(value: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => value,
  } as Response;
}

function dayRange(index: number) {
  const start = new Date(Date.UTC(2020, 0, 1 + index));
  const end = new Date(Date.UTC(2020, 0, 2 + index));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function makeContext(forwardedFor = "203.0.113.7") {
  return {
    cfopAccount: null,
    user: null,
    req: {
      headers: { "x-forwarded-for": forwardedFor },
      socket: { remoteAddress: "10.0.0.1" },
    },
    res: { setHeader: vi.fn() },
  } as unknown as TrpcContext;
}

beforeEach(() => {
  clearWcaMemoryCache();
  clearWcaRateLimits();
  vi.unstubAllGlobals();
});

afterEach(() => {
  clearWcaMemoryCache();
  clearWcaRateLimits();
  vi.unstubAllGlobals();
});

describe("A2: WCA báo đúng lỗi", () => {
  it("khoảng ngày 3 năm trả BAD_REQUEST với thông báo giới hạn", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const caller = appRouter.createCaller(makeContext());

    await expect(
      caller.wca.competitions({ start: "2023-01-01", end: "2026-01-01" })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Khoảng ngày quá dài. Tối đa 366 ngày.",
    });
  });

  it("lỗi TRPCError của service không bị đổi thành lỗi chung", async () => {
    const { wcaError } = await import("./routers/wca");
    const { TRPCError } = await import("@trpc/server");

    expect(() =>
      wcaError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Khoảng ngày quá dài. Tối đa 366 ngày.",
        })
      )
    ).toThrowError(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: "Khoảng ngày quá dài. Tối đa 366 ngày.",
      })
    );
  });
});

describe("A2: hạn mức WCA theo người gọi", () => {
  async function callsUntilBlocked(callerFor: (attempt: number) => string) {
    let allowed = 0;
    for (let attempt = 0; attempt < 400; attempt += 1) {
      try {
        await getWcaCompetitions(dayRange(attempt), callerFor(attempt));
        allowed += 1;
      } catch {
        return allowed;
      }
    }
    return allowed;
  }

  it("đổi ngày liên tiếp không qua mặt hạn mức", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockJson([]));
    vi.stubGlobal("fetch", fetchMock);

    const allowed = await callsUntilBlocked(() => "caller-a");

    expect(allowed).toBeGreaterThan(0);
    expect(allowed).toBeLessThanOrEqual(WCA_CALLER_RATE_LIMIT.limit);
  });

  it("người gọi khác có hạn mức riêng", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockJson([])));

    await callsUntilBlocked(() => "caller-a");
    const allowedForB = await callsUntilBlocked(() => "caller-b");
    expect(allowedForB).toBeGreaterThan(0);
  });

  it("giữ hạn mức toàn cục để bảo vệ WCA", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockJson([])));

    const allowed = await callsUntilBlocked(attempt => `caller-${attempt}`);

    expect(allowed).toBeGreaterThan(0);
    expect(allowed).toBeLessThanOrEqual(WCA_GLOBAL_RATE_LIMIT.limit);
  });

  it("hết hạn mức trả 429 chứ không phải 503", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockJson([])));
    const { wcaError } = await import("./routers/wca");
    const { WcaApiError } = await import("./services/wcaApi");

    expect(() =>
      wcaError(new WcaApiError("RATE_LIMITED", "Yêu cầu WCA quá nhiều. Hãy thử lại sau.")),
    ).toThrowError(expect.objectContaining({ code: "TOO_MANY_REQUESTS" }));
    expect(() =>
      wcaError(new WcaApiError("UNAVAILABLE", "Không thể kết nối WCA lúc này. Hãy thử lại sau.")),
    ).toThrowError(expect.objectContaining({ code: "SERVICE_UNAVAILABLE" }));
  });

  it("bảng đếm có kích thước tối đa", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockJson([])));

    for (let attempt = 0; attempt < 50; attempt += 1) {
      await getWcaCompetitions(dayRange(attempt), `caller-${attempt}`);
    }
    const { wcaRateLimitBuckets } = await import("./services/wcaApi");
    const { caller } = wcaRateLimitBuckets();
    expect(caller).toBeLessThanOrEqual(10_000);
  });
});
