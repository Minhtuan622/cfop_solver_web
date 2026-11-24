import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

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

    for (let attempt = 0; attempt < PLAYER_HISTORY_LIMIT; attempt += 1) {
      await caller.competition.playerHistory({ accountId: 1 });
    }
    await expect(
      caller.competition.playerHistory({ accountId: 1 })
    ).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });

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

    const { roomCreateLimiter } = await import("./routers/competition");
    expect(roomCreateLimiter.size()).toBe(0);
    expect(playerHistoryLimiter.size()).toBeGreaterThan(0);
  });
});
