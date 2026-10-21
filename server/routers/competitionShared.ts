import { TRPCError } from "@trpc/server";
import { compareCompetitionResults, competitionFormatScore, competitionRoundLimit, type CompetitionFormat } from "../services/competition";
import { findCompetitionMember, findCompetitionRoomByCode, findLatestCompetitionModerationLog, getCompetitionActiveRound, listCompetitionMembers, listCompetitionMessages, listCompetitionModerationLogs, listCompetitionResults, listFinishedCompetitionRoomsForAccount, touchCompetitionMember } from "../db";

type CompetitionResultRow = Awaited<ReturnType<typeof listCompetitionResults>>[number];

export function normalizeRoomCode(value: string) { return value.toUpperCase().replace(/[^A-Z0-9]/g, ""); }
export function roomError() { return new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy phòng thi đấu này." }); }
export async function requireCompetitionRoom(code: string) { const room = await findCompetitionRoomByCode(normalizeRoomCode(code)); if (!room) throw roomError(); return room; }
export async function requireCompetitionMember(roomId: number, accountId: number) { const member = await findCompetitionMember(roomId, accountId); if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Bạn chưa tham gia phòng này." }); if (member.removedAt) throw new TRPCError({ code: "FORBIDDEN", message: "Bạn đã bị quản trị viên loại khỏi phòng." }); return member; }

export async function competitionRoomState(code: string, accountId: number, options: { includeResults?: boolean } = {}) {
  const room = await requireCompetitionRoom(code);
  const removedMembership = await findCompetitionMember(room.id, accountId);
  if (removedMembership?.removedAt) {
    const removal = await findLatestCompetitionModerationLog(room.id, accountId);
    const reason = removal?.reason ?? "Không có lý do được lưu.";
    throw new TRPCError({ code: "FORBIDDEN", message: `Bạn đã bị quản trị viên loại khỏi phòng. Lý do: ${reason}` });
  }
  const membership = await requireCompetitionMember(room.id, accountId);
  await touchCompetitionMember(room.id, accountId);
  const [members, activeRound, results, messages, moderationLogs] = await Promise.all([listCompetitionMembers(room.id), getCompetitionActiveRound(room.id), listCompetitionResults(room.id), listCompetitionMessages(room.id), listCompetitionModerationLogs(room.id)]);
  const players = members.filter((member) => member.role === "player").map((member) => {
    const history = results.filter((result) => result.accountId === member.accountId);
    const lastResult = history.at(-1) ?? null;
    const currentResult = activeRound ? history.find((result) => result.roundId === activeRound.id) ?? null : null;
    const score = competitionFormatScore(room.format, history.map((result) => ({ elapsedMs: result.elapsedMs, penalty: result.penalty, multiBlindScore: result.multiBlindScore, multiBlindAttempted: result.multiBlindAttempted, multiBlindSolved: result.multiBlindSolved })), room.eventId);
    return { ...member, solves: history.length, score, lastResult: lastResult ? { elapsedMs: lastResult.elapsedMs, penalty: lastResult.penalty, multiBlindAttempted: lastResult.multiBlindAttempted, multiBlindSolved: lastResult.multiBlindSolved, multiBlindScore: lastResult.multiBlindScore, roundSequence: lastResult.roundSequence } : null, currentResult: currentResult ? { elapsedMs: currentResult.elapsedMs, inspectionMs: currentResult.inspectionMs, penalty: currentResult.penalty, multiBlindAttempted: currentResult.multiBlindAttempted, multiBlindSolved: currentResult.multiBlindSolved, multiBlindScore: currentResult.multiBlindScore, submittedAt: currentResult.submittedAt } : null };
  });
  const standings = [...players].filter((player) => player.lastResult).sort((left, right) => compareCompetitionResults(room.eventId, left.lastResult!, right.lastResult!)).map((player, index) => ({ ...player, rank: index + 1 }));
  const scrambleBundle = activeRound && Array.isArray(activeRound.scrambleBundle) ? activeRound.scrambleBundle.filter((value): value is string => typeof value === "string") : [];
  const onlineSpectators = members.filter((member) => member.role !== "player" && member.lastSeen.getTime() >= Date.now() - 20_000);
  return { room, members, isHost: room.hostAccountId === accountId, isSpectator: membership.role !== "player", isModerator: membership.role === "moderator", onlineSpectatorCount: onlineSpectators.length, onlineSpectators, roundLimit: competitionRoundLimit(room.format, room.eventId), activeRound: activeRound ? { id: activeRound.id, sequence: activeRound.sequence, scramble: activeRound.scramble, scrambleBundle, startedAt: activeRound.startedAt } : null, players, standings, ...(options.includeResults ? { results } : {}), messages, moderationLogs: room.hostAccountId === accountId || membership.role === "moderator" ? moderationLogs : [] };
}

export async function competitionHistory(accountId: number) {
  const rooms = await listFinishedCompetitionRoomsForAccount(accountId);
  return Promise.all(rooms.map(async ({ room }) => {
    const state = await competitionRoomState(room.code, accountId);
    const mine = state.standings.find((player) => player.accountId === accountId);
    return { room: state.room, roundLimit: state.roundLimit, standings: state.standings, myRank: mine?.rank ?? null, myScore: mine?.score ?? undefined };
  }));
}

export function standingsFromResults(format: CompetitionFormat, eventId: string, results: CompetitionResultRow[]) {
  const players = new Map<number, CompetitionResultRow[]>();
  for (const result of results) players.set(result.accountId, [...(players.get(result.accountId) ?? []), result]);
  return Array.from(players.entries()).map(([accountId, history]) => {
    const lastResult = history.at(-1) ?? null;
    const score = competitionFormatScore(format, history.map((result) => ({ elapsedMs: result.elapsedMs, penalty: result.penalty, multiBlindScore: result.multiBlindScore, multiBlindAttempted: result.multiBlindAttempted, multiBlindSolved: result.multiBlindSolved })), eventId);
    return { accountId, displayName: history[0].displayName, avatarUrl: history[0].avatarUrl, solves: history.length, score, lastResult: lastResult ? { elapsedMs: lastResult.elapsedMs, inspectionMs: lastResult.inspectionMs, penalty: lastResult.penalty, multiBlindAttempted: lastResult.multiBlindAttempted, multiBlindSolved: lastResult.multiBlindSolved, multiBlindScore: lastResult.multiBlindScore, submittedAt: lastResult.submittedAt, roundSequence: lastResult.roundSequence } : null, history };
  }).filter((player) => player.lastResult).sort((left, right) => compareCompetitionResults(eventId, left.lastResult!, right.lastResult!)).map((player, index) => ({ ...player, rank: index + 1 }));
}

export function leaderboardRange(period: "week" | "month", now = new Date()) {
  const endAt = new Date(now); const startAt = new Date(now);
  if (period === "month") startAt.setUTCDate(1); else { const day = startAt.getUTCDay() || 7; startAt.setUTCDate(startAt.getUTCDate() - day + 1); }
  startAt.setUTCHours(0, 0, 0, 0); return { startAt, endAt };
}
