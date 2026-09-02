import { and, asc, desc, eq, gte, isNull, lt } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { cfopAccounts, cfopCompetitionMembers, cfopCompetitionMessages, cfopCompetitionModerationLogs, cfopCompetitionResults, cfopCompetitionRooms, cfopCompetitionRounds } from "../../drizzle/schema";
import type { TimerEventId } from "../../shared/timerEvents";
import { requireDb } from "./core";
import { competitionMemberSelect, competitionMessageSelect, competitionResultSelect, competitionRoomMembershipSelect, finishedCompetitionResultSelect } from "./selectors";

export async function createCompetitionRoom(values: { code: string; name: string; hostAccountId: number; maxPlayers: number; format: "best_of_3" | "ao5" | "ao12"; eventId: TimerEventId; multiBlindCubes: number }) {
  const db = await requireDb();
  await db.insert(cfopCompetitionRooms).values(values);
  const room = (await db.select().from(cfopCompetitionRooms).where(eq(cfopCompetitionRooms.code, values.code)).limit(1))[0];
  if (!room) throw new Error("Room creation did not return a row");
  await db.insert(cfopCompetitionMembers).values({ roomId: room.id, accountId: values.hostAccountId });
  return room;
}

export async function createCompetitionRematch(sourceRoomId: number, code: string) {
  const db = await requireDb();
  const source = (await db.select().from(cfopCompetitionRooms).where(eq(cfopCompetitionRooms.id, sourceRoomId)).limit(1))[0];
  if (!source) throw new Error("Source room not found");
  const members = await db.select({ accountId: cfopCompetitionMembers.accountId, role: cfopCompetitionMembers.role }).from(cfopCompetitionMembers).where(eq(cfopCompetitionMembers.roomId, sourceRoomId));
  await db.insert(cfopCompetitionRooms).values({ code, name: `${source.name} · Đấu lại`.slice(0, 80), hostAccountId: source.hostAccountId, maxPlayers: source.maxPlayers, format: source.format, eventId: source.eventId, multiBlindCubes: source.multiBlindCubes });
  const room = (await db.select().from(cfopCompetitionRooms).where(eq(cfopCompetitionRooms.code, code)).limit(1))[0];
  if (!room) throw new Error("Rematch creation did not return a row");
  if (members.length) await db.insert(cfopCompetitionMembers).values(members.map((member) => ({ roomId: room.id, accountId: member.accountId, role: member.role })));
  return room;
}

export async function findCompetitionRoomByCode(code: string) { const db = await requireDb(); return (await db.select().from(cfopCompetitionRooms).where(eq(cfopCompetitionRooms.code, code)).limit(1))[0] ?? null; }
export async function findCompetitionMember(roomId: number, accountId: number) { const db = await requireDb(); return (await db.select().from(cfopCompetitionMembers).where(and(eq(cfopCompetitionMembers.roomId, roomId), eq(cfopCompetitionMembers.accountId, accountId))).limit(1))[0] ?? null; }
export async function joinCompetitionRoom(roomId: number, accountId: number, role: "player" | "spectator" = "player") { const db = await requireDb(); await db.insert(cfopCompetitionMembers).values({ roomId, accountId, role }); return findCompetitionMember(roomId, accountId); }
export async function leaveCompetitionRoom(roomId: number, accountId: number) { const db = await requireDb(); await db.delete(cfopCompetitionMembers).where(and(eq(cfopCompetitionMembers.roomId, roomId), eq(cfopCompetitionMembers.accountId, accountId))); }
export async function markCompetitionSpectatorRemoved(roomId: number, accountId: number) { const db = await requireDb(); await db.update(cfopCompetitionMembers).set({ removedAt: new Date(), lastSeen: new Date() }).where(and(eq(cfopCompetitionMembers.roomId, roomId), eq(cfopCompetitionMembers.accountId, accountId))); }
export async function createCompetitionModerationLog(values: { roomId: number; actorAccountId: number; targetAccountId: number; reason: string }) { const db = await requireDb(); await db.insert(cfopCompetitionModerationLogs).values(values); }
export async function findLatestCompetitionModerationLog(roomId: number, targetAccountId: number) { const db = await requireDb(); return (await db.select().from(cfopCompetitionModerationLogs).where(and(eq(cfopCompetitionModerationLogs.roomId, roomId), eq(cfopCompetitionModerationLogs.targetAccountId, targetAccountId), eq(cfopCompetitionModerationLogs.action, "remove_spectator"))).orderBy(desc(cfopCompetitionModerationLogs.createdAt)).limit(1))[0] ?? null; }

export async function listCompetitionModerationLogs(roomId: number, limit = 50) {
  const db = await requireDb();
  const actor = alias(cfopAccounts, "competition_moderation_actor"); const target = alias(cfopAccounts, "competition_moderation_target");
  const rows = await db.select({ id: cfopCompetitionModerationLogs.id, action: cfopCompetitionModerationLogs.action, reason: cfopCompetitionModerationLogs.reason, createdAt: cfopCompetitionModerationLogs.createdAt, actorAccountId: cfopCompetitionModerationLogs.actorAccountId, actorDisplayName: actor.displayName, targetAccountId: cfopCompetitionModerationLogs.targetAccountId, targetDisplayName: target.displayName }).from(cfopCompetitionModerationLogs).innerJoin(actor, eq(cfopCompetitionModerationLogs.actorAccountId, actor.id)).innerJoin(target, eq(cfopCompetitionModerationLogs.targetAccountId, target.id)).where(eq(cfopCompetitionModerationLogs.roomId, roomId)).orderBy(desc(cfopCompetitionModerationLogs.createdAt)).limit(limit);
  return rows.reverse();
}

export async function touchCompetitionMember(roomId: number, accountId: number) { const db = await requireDb(); await db.update(cfopCompetitionMembers).set({ lastSeen: new Date() }).where(and(eq(cfopCompetitionMembers.roomId, roomId), eq(cfopCompetitionMembers.accountId, accountId))); }
export async function updateCompetitionMemberRole(roomId: number, accountId: number, role: "player" | "spectator" | "moderator") { const db = await requireDb(); await db.update(cfopCompetitionMembers).set({ role, lastSeen: new Date() }).where(and(eq(cfopCompetitionMembers.roomId, roomId), eq(cfopCompetitionMembers.accountId, accountId))); return findCompetitionMember(roomId, accountId); }
export async function listCompetitionRoomsForAccount(accountId: number) { const db = await requireDb(); return db.select(competitionRoomMembershipSelect).from(cfopCompetitionMembers).innerJoin(cfopCompetitionRooms, eq(cfopCompetitionMembers.roomId, cfopCompetitionRooms.id)).where(and(eq(cfopCompetitionMembers.accountId, accountId), isNull(cfopCompetitionMembers.removedAt))).orderBy(desc(cfopCompetitionRooms.updatedAt)); }
export async function listFinishedCompetitionRoomsForAccount(accountId: number) { const db = await requireDb(); return db.select(competitionRoomMembershipSelect).from(cfopCompetitionMembers).innerJoin(cfopCompetitionRooms, eq(cfopCompetitionMembers.roomId, cfopCompetitionRooms.id)).where(and(eq(cfopCompetitionMembers.accountId, accountId), isNull(cfopCompetitionMembers.removedAt), eq(cfopCompetitionRooms.status, "finished"))).orderBy(desc(cfopCompetitionRooms.updatedAt)); }
export async function listCompetitionMembers(roomId: number) { const db = await requireDb(); return db.select(competitionMemberSelect).from(cfopCompetitionMembers).innerJoin(cfopAccounts, eq(cfopCompetitionMembers.accountId, cfopAccounts.id)).where(and(eq(cfopCompetitionMembers.roomId, roomId), isNull(cfopCompetitionMembers.removedAt))).orderBy(asc(cfopCompetitionMembers.joinedAt)); }
export async function deleteCompetitionRoom(roomId: number) { const db = await requireDb(); await db.delete(cfopCompetitionRooms).where(eq(cfopCompetitionRooms.id, roomId)); }
export async function getCompetitionActiveRound(roomId: number) { const db = await requireDb(); return (await db.select().from(cfopCompetitionRounds).where(and(eq(cfopCompetitionRounds.roomId, roomId), eq(cfopCompetitionRounds.status, "active"))).orderBy(desc(cfopCompetitionRounds.sequence)).limit(1))[0] ?? null; }

export async function startCompetitionRound(roomId: number, sequence: number, scramble: string, scrambleBundle?: string[]) {
  const db = await requireDb(); await db.insert(cfopCompetitionRounds).values({ roomId, sequence, scramble, scrambleBundle: scrambleBundle?.length ? scrambleBundle : null });
  const round = (await db.select().from(cfopCompetitionRounds).where(and(eq(cfopCompetitionRounds.roomId, roomId), eq(cfopCompetitionRounds.sequence, sequence))).limit(1))[0]; if (!round) throw new Error("Round creation did not return a row");
  await db.update(cfopCompetitionRooms).set({ status: "active", currentRound: sequence, updatedAt: new Date() }).where(eq(cfopCompetitionRooms.id, roomId)); return round;
}
export async function finishCompetitionRound(roundId: number) { const db = await requireDb(); await db.update(cfopCompetitionRounds).set({ status: "finished", completedAt: new Date() }).where(eq(cfopCompetitionRounds.id, roundId)); }
export async function finishCompetitionRoom(roomId: number) { const db = await requireDb(); await db.update(cfopCompetitionRooms).set({ status: "finished", updatedAt: new Date() }).where(eq(cfopCompetitionRooms.id, roomId)); }
export async function findCompetitionResult(roundId: number, accountId: number) { const db = await requireDb(); return (await db.select().from(cfopCompetitionResults).where(and(eq(cfopCompetitionResults.roundId, roundId), eq(cfopCompetitionResults.accountId, accountId))).limit(1))[0] ?? null; }
export async function submitCompetitionResult(values: { roundId: number; accountId: number; elapsedMs: number; inspectionMs: number; penalty: "none" | "+2" | "DNF"; multiBlindAttempted?: number; multiBlindSolved?: number; multiBlindScore?: number }) { const db = await requireDb(); await db.insert(cfopCompetitionResults).values(values); return findCompetitionResult(values.roundId, values.accountId); }

export async function listCompetitionResults(roomId: number) {
  const db = await requireDb(); return db.select(competitionResultSelect).from(cfopCompetitionResults).innerJoin(cfopCompetitionRounds, eq(cfopCompetitionResults.roundId, cfopCompetitionRounds.id)).innerJoin(cfopAccounts, eq(cfopCompetitionResults.accountId, cfopAccounts.id)).where(eq(cfopCompetitionRounds.roomId, roomId)).orderBy(asc(cfopCompetitionRounds.sequence), asc(cfopCompetitionResults.submittedAt));
}
export async function listFinishedCompetitionResultsBetween(startAt: Date, endAt: Date, eventId?: string | null) {
  const db = await requireDb(); const filters = [eq(cfopCompetitionRooms.status, "finished"), gte(cfopCompetitionRooms.updatedAt, startAt), lt(cfopCompetitionRooms.updatedAt, endAt)]; if (eventId) filters.push(eq(cfopCompetitionRooms.eventId, eventId));
  return db.select(finishedCompetitionResultSelect).from(cfopCompetitionResults).innerJoin(cfopCompetitionRounds, eq(cfopCompetitionResults.roundId, cfopCompetitionRounds.id)).innerJoin(cfopCompetitionRooms, eq(cfopCompetitionRounds.roomId, cfopCompetitionRooms.id)).innerJoin(cfopAccounts, eq(cfopCompetitionResults.accountId, cfopAccounts.id)).where(and(...filters)).orderBy(desc(cfopCompetitionRooms.updatedAt), asc(cfopCompetitionRounds.sequence), asc(cfopCompetitionResults.submittedAt));
}
export async function createCompetitionMessage(values: { roomId: number; accountId: number; content: string }) { const db = await requireDb(); await db.insert(cfopCompetitionMessages).values(values); }
export async function listCompetitionMessages(roomId: number, limit = 60) { const db = await requireDb(); const rows = await db.select(competitionMessageSelect).from(cfopCompetitionMessages).innerJoin(cfopAccounts, eq(cfopCompetitionMessages.accountId, cfopAccounts.id)).where(eq(cfopCompetitionMessages.roomId, roomId)).orderBy(desc(cfopCompetitionMessages.createdAt)).limit(limit); return rows.reverse(); }
