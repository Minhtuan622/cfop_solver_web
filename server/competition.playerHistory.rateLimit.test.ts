import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

/**
 * Regression test cho A3: hạn mức xem lịch sử người chơi phải tính theo
 * địa chỉ client thật, không phải địa chỉ socket của reverse proxy.
 *
 * Lỗi thật: `competition.playerHistory` lấy `req.socket.remoteAddress` làm
 * khóa. Sau một reverse proxy mọi người dùng có cùng địa chỉ socket nên
 * dùng chung một hạn mức 30 lần/giờ; và bộ đếm còn bị mượn từ
 * `roomCreateLimiter`.
 *
 * Ngoài ra `clientAddress` phải tôn trọng `TRUST_PROXY`: khi chưa bật thì
 * header `X-Forwarded-For` do client tự viết không được tách hạn mức.
 */

vi.mock("./db", () => ({
  listCompetitionResultsForRooms: vi.fn(async () => []),
  listFinishedCompetitionResultsBetween: vi.fn(async () => []),
  listCompetitionRoomsForAccount: vi.fn(async () => []),
  findCompetitionMember: vi.fn(async () => null),
  createCfopAccount: vi.fn(),
  findCfopAccountByEmail: vi.fn(),
  findCfopAccountPublicById: vi.fn(),
  markCfopAccountSignedIn: vi.fn(),
  createCfopPasswordResetToken: vi.fn(),
  consumeCfopPasswordResetToken: vi.fn(),
  getCfopAccountCloudState: vi.fn(),
  saveCfopAccountCloudState: vi.fn(),
  updateCfopAccountAvatar: vi.fn(),
  updateCfopAccountPassword: vi.fn(),
  updateCfopAccountProfile: vi.fn(),
  findCfopAccountWcaById: vi.fn(),
  updateCfopAccountWcaId: vi.fn(),
  submitCompetitionResult: vi.fn(),
  findCompetitionRoomByCode: vi.fn(),
  createCompetitionRoom: vi.fn(),
  joinCompetitionRoom: vi.fn(),
  leaveCompetitionRoom: vi.fn(),
  createCompetitionMessage: vi.fn(),
  createCompetitionModerationLog: vi.fn(),
  deleteCompetitionRoom: vi.fn(),
  getCompetitionActiveRound: vi.fn(),
  startCompetitionRound: vi.fn(),
  finishCompetitionRound: vi.fn(),
  finishCompetitionRoom: vi.fn(),
  markCompetitionSpectatorRemoved: vi.fn(),
  updateCompetitionMemberRole: vi.fn(),
  createCompetitionRematch: vi.fn(),
  listCompetitionMembers: vi.fn(),
  listFinishedCompetitionRoomsForAccount: vi.fn(async () => []),
}));

import { appRouter } from "./routers";
import { playerHistoryLimiter } from "./routers/competition";

/** Số lần tra lịch sử được phép trong một giờ cho mỗi địa chỉ. */
const PLAYER_HISTORY_LIMIT = 30;

function makeContext(forwardedFor: string, socketAddress = "10.0.0.1") {
  return {
    cfopAccount: null,
    user: null,
    req: {
      headers: { "x-forwarded-for": forwardedFor },
      socket: { remoteAddress: socketAddress },
    },
    res: { setHeader: vi.fn() },
  } as unknown as TrpcContext;
}

describe("A3: hạn mức playerHistory theo địa chỉ client", () => {
  const originalTrustProxy = process.env.TRUST_PROXY;

  beforeEach(() => {
    playerHistoryLimiter.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalTrustProxy === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = originalTrustProxy;
  });

  it("hai địa chỉ khác nhau có hạn mức tách biệt khi TRUST_PROXY=1", async () => {
    process.env.TRUST_PROXY = "1";
    const caller = appRouter.createCaller(makeContext("203.0.113.7"));

    // Hết hạn mức của địa chỉ này.
    for (let attempt = 0; attempt < PLAYER_HISTORY_LIMIT; attempt += 1) {
      await caller.competition.playerHistory({ accountId: 1 });
    }
    await expect(
      caller.competition.playerHistory({ accountId: 1 })
    ).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });

    // Địa chỉ khác vẫn còn hạn mức riêng.
    const other = appRouter.createCaller(makeContext("198.51.100.9"));
    await expect(
      other.competition.playerHistory({ accountId: 1 })
    ).resolves.toBeDefined();
  });

  it("X-Forwarded-For giả không tách được hạn mức khi chưa bật TRUST_PROXY", async () => {
    delete process.env.TRUST_PROXY;
    const caller = appRouter.createCaller(makeContext("203.0.113.7"));

    for (let attempt = 0; attempt < PLAYER_HISTORY_LIMIT; attempt += 1) {
      await caller.competition.playerHistory({ accountId: 1 });
    }

    // Đổi header sang một địa chỉ khác vẫn bị chặn: header do client tự viết.
    const forged = appRouter.createCaller(makeContext("198.51.100.9"));
    await expect(
      forged.competition.playerHistory({ accountId: 1 })
    ).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
  });

  it("dùng limiter riêng, không mượn bảng đếm của tạo phòng", async () => {
    process.env.TRUST_PROXY = "1";
    const caller = appRouter.createCaller(makeContext("203.0.113.7"));

    for (let attempt = 0; attempt < PLAYER_HISTORY_LIMIT; attempt += 1) {
      await caller.competition.playerHistory({ accountId: 1 });
    }
    await expect(
      caller.competition.playerHistory({ accountId: 1 })
    ).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });

    // Bảng đếm của playerHistory đã đầy, nhưng limiter tạo phòng vẫn trống.
    const { roomCreateLimiter } = await import("./routers/competition");
    expect(roomCreateLimiter.size()).toBe(0);
    expect(playerHistoryLimiter.size()).toBeGreaterThan(0);
  });
});
