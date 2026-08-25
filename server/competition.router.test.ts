import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  findCompetitionRoomByCode: vi.fn(),
  findCompetitionMember: vi.fn(),
  listCompetitionMembers: vi.fn(),
  getCompetitionActiveRound: vi.fn(),
  findCompetitionResult: vi.fn(),
  submitCompetitionResult: vi.fn(),
  createCompetitionMessage: vi.fn(),
  finishCompetitionRound: vi.fn(),
  startCompetitionRound: vi.fn(),
}));

import { appRouter } from "./routers";
import { createCompetitionMessage, findCompetitionMember, findCompetitionResult, findCompetitionRoomByCode, getCompetitionActiveRound, listCompetitionMembers, startCompetitionRound, submitCompetitionResult } from "./db";

const room = { id: 9, code: "ABC123", name: "Test room", hostAccountId: 1, status: "waiting", format: "ao5" as const, maxPlayers: 8, currentRound: 0, createdAt: new Date(), updatedAt: new Date() };
const ctx = { cfopAccount: { id: 1, email: "host@example.com", displayName: "Host", bio: "", avatarUrl: "", goalMs: null, createdAt: new Date(), lastSignedIn: new Date() }, req: {}, res: {} } as unknown as TrpcContext;

describe("competition router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("không cho chủ phòng bắt đầu lượt khi chưa có hai thành viên", async () => {
    vi.mocked(findCompetitionRoomByCode).mockResolvedValue(room);
    vi.mocked(listCompetitionMembers).mockResolvedValue([{ accountId: 1, displayName: "Host", avatarUrl: "", joinedAt: new Date() }]);
    await expect(appRouter.createCaller(ctx).competition.startRound({ code: room.code })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(startCompetitionRound).not.toHaveBeenCalled();
  });

  it("chỉ nhận một kết quả đúng lượt từ thành viên phòng", async () => {
    vi.mocked(findCompetitionRoomByCode).mockResolvedValue(room);
    vi.mocked(findCompetitionMember).mockResolvedValue({ id: 3, roomId: room.id, accountId: 1, joinedAt: new Date() });
    vi.mocked(getCompetitionActiveRound).mockResolvedValue({ id: 22, roomId: room.id, sequence: 1, scramble: "R U R'", status: "active", startedAt: new Date(), completedAt: null });
    vi.mocked(findCompetitionResult).mockResolvedValue(null);
    vi.mocked(submitCompetitionResult).mockResolvedValue({ id: 5, roundId: 22, accountId: 1, elapsedMs: 10_000, inspectionMs: 0, penalty: "none", submittedAt: new Date() });
    await expect(appRouter.createCaller(ctx).competition.submit({ code: room.code, roundId: 22, elapsedMs: 10_000, inspectionMs: 0, penalty: "none" })).resolves.toEqual({ success: true });
    expect(submitCompetitionResult).toHaveBeenCalledWith(expect.objectContaining({ roundId: 22, accountId: 1 }));
  });

  it("gắn tin nhắn chat với thành viên và phòng hiện tại", async () => {
    vi.mocked(findCompetitionRoomByCode).mockResolvedValue(room);
    vi.mocked(findCompetitionMember).mockResolvedValue({ id: 3, roomId: room.id, accountId: 1, joinedAt: new Date() });
    await expect(appRouter.createCaller(ctx).competition.sendMessage({ code: room.code, content: "Chúc mọi người PB!" })).resolves.toEqual({ success: true });
    expect(createCompetitionMessage).toHaveBeenCalledWith({ roomId: room.id, accountId: 1, content: "Chúc mọi người PB!" });
  });
});
