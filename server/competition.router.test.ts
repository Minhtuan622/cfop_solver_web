import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  findCompetitionRoomByCode: vi.fn(),
  findCompetitionMember: vi.fn(),
  listCompetitionMembers: vi.fn(),
  getCompetitionActiveRound: vi.fn(),
  findCompetitionResult: vi.fn(),
  submitCompetitionResult: vi.fn(),
  createCompetitionRoom: vi.fn(),
  joinCompetitionRoom: vi.fn(),
  leaveCompetitionRoom: vi.fn(),
  deleteCompetitionRoom: vi.fn(),
  touchCompetitionMember: vi.fn(),
  updateCompetitionMemberRole: vi.fn(),
  createCompetitionMessage: vi.fn(),
  createCompetitionRematch: vi.fn(),
  finishCompetitionRound: vi.fn(),
  startCompetitionRound: vi.fn(),
  listFinishedCompetitionRoomsForAccount: vi.fn(),
  listCompetitionResults: vi.fn(),
  listCompetitionMessages: vi.fn(),
  listFinishedCompetitionResultsBetween: vi.fn(),
}));

import { appRouter } from "./routers";
import { createCompetitionMessage, createCompetitionRematch, createCompetitionRoom, deleteCompetitionRoom, findCompetitionMember, findCompetitionResult, findCompetitionRoomByCode, getCompetitionActiveRound, joinCompetitionRoom, leaveCompetitionRoom, listCompetitionMembers, listCompetitionMessages, listCompetitionResults, listFinishedCompetitionRoomsForAccount, listFinishedCompetitionResultsBetween, startCompetitionRound, submitCompetitionResult, touchCompetitionMember, updateCompetitionMemberRole } from "./db";

const room = { id: 9, code: "ABC123", name: "Test room", hostAccountId: 1, status: "waiting", format: "ao5" as const, eventId: "333", multiBlindCubes: 2, maxPlayers: 8, currentRound: 0, createdAt: new Date(), updatedAt: new Date() };
const ctx = { cfopAccount: { id: 1, email: "host@example.com", displayName: "Host", bio: "", avatarUrl: "", goalMs: null, createdAt: new Date(), lastSignedIn: new Date() }, req: {}, res: {} } as unknown as TrpcContext;

describe("competition router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lưu event Timer được chọn khi tạo phòng", async () => {
    vi.mocked(findCompetitionRoomByCode).mockResolvedValue(null);
    vi.mocked(createCompetitionRoom).mockResolvedValue({ ...room, eventId: "555bf" });
    await expect(appRouter.createCaller(ctx).competition.create({ name: "5×5 BLD", maxPlayers: 4, format: "ao5", eventId: "555bf" })).resolves.toEqual({ code: room.code });
    expect(createCompetitionRoom).toHaveBeenCalledWith(expect.objectContaining({ name: "5×5 BLD", eventId: "555bf", hostAccountId: 1 }));
  });

  it("không cho chủ phòng bắt đầu lượt khi chưa có hai thành viên", async () => {
    vi.mocked(findCompetitionRoomByCode).mockResolvedValue(room);
    vi.mocked(listCompetitionMembers).mockResolvedValue([{ accountId: 1, displayName: "Host", avatarUrl: "", role: "player", joinedAt: new Date(), lastSeen: new Date() }]);
    await expect(appRouter.createCaller(ctx).competition.startRound({ code: room.code })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(startCompetitionRound).not.toHaveBeenCalled();
  });

  it("chỉ nhận một kết quả đúng lượt từ thành viên phòng", async () => {
    vi.mocked(findCompetitionRoomByCode).mockResolvedValue(room);
    vi.mocked(findCompetitionMember).mockResolvedValue({ id: 3, roomId: room.id, accountId: 1, role: "player", joinedAt: new Date() });
    vi.mocked(getCompetitionActiveRound).mockResolvedValue({ id: 22, roomId: room.id, sequence: 1, scramble: "R U R'", status: "active", startedAt: new Date(), completedAt: null });
    vi.mocked(findCompetitionResult).mockResolvedValue(null);
    vi.mocked(submitCompetitionResult).mockResolvedValue({ id: 5, roundId: 22, accountId: 1, elapsedMs: 10_000, inspectionMs: 0, penalty: "none", submittedAt: new Date() });
    await expect(appRouter.createCaller(ctx).competition.submit({ code: room.code, roundId: 22, elapsedMs: 10_000, inspectionMs: 0, penalty: "none" })).resolves.toEqual({ success: true });
    expect(submitCompetitionResult).toHaveBeenCalledWith(expect.objectContaining({ roundId: 22, accountId: 1 }));
  });

  it("gắn tin nhắn chat với thành viên và phòng hiện tại", async () => {
    vi.mocked(findCompetitionRoomByCode).mockResolvedValue(room);
    vi.mocked(findCompetitionMember).mockResolvedValue({ id: 3, roomId: room.id, accountId: 1, role: "player", joinedAt: new Date() });
    await expect(appRouter.createCaller(ctx).competition.sendMessage({ code: room.code, content: "Chúc mọi người PB!" })).resolves.toEqual({ success: true });
    expect(createCompetitionMessage).toHaveBeenCalledWith({ roomId: room.id, accountId: 1, content: "Chúc mọi người PB!" });
  });

  it("chỉ tạo Đấu lại khi chủ phòng đã kết thúc trận", async () => {
    const finishedRoom = { ...room, status: "finished" as const, currentRound: 5 };
    vi.mocked(findCompetitionRoomByCode).mockResolvedValueOnce(finishedRoom).mockResolvedValueOnce(null);
    vi.mocked(createCompetitionRematch).mockResolvedValue({ ...finishedRoom, id: 10, code: "NEXT99", name: "Test room · Đấu lại", status: "waiting", currentRound: 0 });
    await expect(appRouter.createCaller(ctx).competition.rematch({ code: room.code })).resolves.toEqual({ code: "NEXT99" });
    expect(createCompetitionRematch).toHaveBeenCalledWith(room.id, expect.any(String));
  });

  it("trả lịch sử phòng đã kết thúc với thứ hạng cuối của thành viên", async () => {
    const finishedRoom = { ...room, status: "finished" as const, currentRound: 5 };
    vi.mocked(listFinishedCompetitionRoomsForAccount).mockResolvedValue([{ room: finishedRoom, joinedAt: new Date() }]);
    vi.mocked(findCompetitionRoomByCode).mockResolvedValue(finishedRoom);
    vi.mocked(findCompetitionMember).mockResolvedValue({ id: 3, roomId: room.id, accountId: 1, role: "player", joinedAt: new Date() });
    vi.mocked(listCompetitionMembers).mockResolvedValue([{ accountId: 1, displayName: "Host", avatarUrl: "", role: "player", joinedAt: new Date(), lastSeen: new Date() }, { accountId: 2, displayName: "Cuber", avatarUrl: "", role: "player", joinedAt: new Date(), lastSeen: new Date() }]);
    vi.mocked(getCompetitionActiveRound).mockResolvedValue(null);
    vi.mocked(listCompetitionMessages).mockResolvedValue([]);
    vi.mocked(listCompetitionResults).mockResolvedValue([
      { roundSequence: 1, roundId: 11, accountId: 1, displayName: "Host", avatarUrl: "", elapsedMs: 10_000, inspectionMs: 0, penalty: "none", submittedAt: new Date() },
      { roundSequence: 1, roundId: 11, accountId: 2, displayName: "Cuber", avatarUrl: "", elapsedMs: 12_000, inspectionMs: 0, penalty: "none", submittedAt: new Date() },
    ]);
    const history = await appRouter.createCaller(ctx).competition.history();
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ room: { code: room.code }, myRank: 1 });
  });

  it("cho khán giả vào phòng nhưng cấm nộp kết quả", async () => {
    vi.mocked(findCompetitionRoomByCode).mockResolvedValue(room);
    vi.mocked(findCompetitionMember).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 6, roomId: room.id, accountId: 1, role: "spectator", joinedAt: new Date() });
    await expect(appRouter.createCaller(ctx).competition.spectate({ code: room.code })).resolves.toEqual({ code: room.code });
    expect(joinCompetitionRoom).toHaveBeenCalledWith(room.id, 1, "spectator");
    await expect(appRouter.createCaller(ctx).competition.submit({ code: room.code, roundId: 22, elapsedMs: 10_000, inspectionMs: 0, penalty: "none" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("đếm spectator có heartbeat gần đây trong state phòng", async () => {
    vi.mocked(findCompetitionRoomByCode).mockResolvedValue(room);
    vi.mocked(findCompetitionMember).mockResolvedValue({ id: 3, roomId: room.id, accountId: 1, role: "player", joinedAt: new Date(), lastSeen: new Date() });
    vi.mocked(listCompetitionMembers).mockResolvedValue([{ accountId: 1, displayName: "Host", avatarUrl: "", role: "player", joinedAt: new Date(), lastSeen: new Date() }, { accountId: 2, displayName: "Viewer", avatarUrl: "", role: "spectator", joinedAt: new Date(), lastSeen: new Date() }]);
    vi.mocked(getCompetitionActiveRound).mockResolvedValue(null);
    vi.mocked(listCompetitionResults).mockResolvedValue([]);
    vi.mocked(listCompetitionMessages).mockResolvedValue([]);
    await expect(appRouter.createCaller(ctx).competition.state({ code: room.code })).resolves.toMatchObject({ onlineSpectatorCount: 1, onlineSpectators: [expect.objectContaining({ displayName: "Viewer", role: "spectator" })] });
    expect(touchCompetitionMember).toHaveBeenCalledWith(room.id, 1);
  });

  it("chỉ chủ phòng được xóa phòng chờ hoặc đã kết thúc", async () => {
    vi.mocked(findCompetitionRoomByCode).mockResolvedValue(room);
    await expect(appRouter.createCaller(ctx).competition.delete({ code: room.code })).resolves.toEqual({ success: true });
    expect(deleteCompetitionRoom).toHaveBeenCalledWith(room.id);
  });

  it("chủ phòng cấp/gỡ moderator và moderator chỉ quản lý spectator", async () => {
    vi.mocked(findCompetitionRoomByCode).mockResolvedValue(room);
    vi.mocked(findCompetitionMember).mockResolvedValueOnce({ id: 8, roomId: room.id, accountId: 2, role: "spectator", joinedAt: new Date(), lastSeen: new Date() });
    await expect(appRouter.createCaller(ctx).competition.grantModerator({ code: room.code, accountId: 2 })).resolves.toEqual({ success: true });
    expect(updateCompetitionMemberRole).toHaveBeenCalledWith(room.id, 2, "moderator");
    vi.mocked(findCompetitionMember).mockResolvedValueOnce({ id: 8, roomId: room.id, accountId: 2, role: "moderator", joinedAt: new Date(), lastSeen: new Date() });
    await expect(appRouter.createCaller(ctx).competition.revokeModerator({ code: room.code, accountId: 2 })).resolves.toEqual({ success: true });
    expect(updateCompetitionMemberRole).toHaveBeenCalledWith(room.id, 2, "spectator");
    vi.mocked(findCompetitionMember).mockResolvedValueOnce({ id: 3, roomId: room.id, accountId: 1, role: "player", joinedAt: new Date(), lastSeen: new Date() }).mockResolvedValueOnce({ id: 8, roomId: room.id, accountId: 2, role: "spectator", joinedAt: new Date(), lastSeen: new Date() });
    await expect(appRouter.createCaller(ctx).competition.removeSpectator({ code: room.code, accountId: 2 })).resolves.toEqual({ success: true });
    expect(leaveCompetitionRoom).toHaveBeenCalledWith(room.id, 2);
    expect(createCompetitionMessage).toHaveBeenCalledWith({ roomId: room.id, accountId: 1, content: "[system] Moderator đã loại một người xem khỏi phòng." });
  });

  it("trả bảng xếp hạng tuần từ điểm tổng hợp, không cần đăng nhập", async () => {
    vi.mocked(listFinishedCompetitionResultsBetween).mockResolvedValue([
      { roomId: 1, roomFormat: "best_of_3", accountId: 1, displayName: "Host", avatarUrl: "", elapsedMs: 10_000, penalty: "none", roundSequence: 1 },
      { roomId: 1, roomFormat: "best_of_3", accountId: 1, displayName: "Host", avatarUrl: "", elapsedMs: 11_000, penalty: "none", roundSequence: 2 },
      { roomId: 1, roomFormat: "best_of_3", accountId: 1, displayName: "Host", avatarUrl: "", elapsedMs: 12_000, penalty: "none", roundSequence: 3 },
      { roomId: 1, roomFormat: "best_of_3", accountId: 2, displayName: "Cuber", avatarUrl: "", elapsedMs: 13_000, penalty: "none", roundSequence: 1 },
      { roomId: 1, roomFormat: "best_of_3", accountId: 2, displayName: "Cuber", avatarUrl: "", elapsedMs: 14_000, penalty: "none", roundSequence: 2 },
      { roomId: 1, roomFormat: "best_of_3", accountId: 2, displayName: "Cuber", avatarUrl: "", elapsedMs: 15_000, penalty: "none", roundSequence: 3 },
    ]);
    const result = await appRouter.createCaller(ctx).competition.leaderboard({ period: "week" });
    expect(result.players[0]).toMatchObject({ rank: 1, accountId: 1, points: 10 });
  });
});
