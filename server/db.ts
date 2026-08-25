import { and, asc, desc, eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { CfopAccount, cfopAccountCloudStates, cfopAccountSessions, cfopAccounts, cfopCompetitionMembers, cfopCompetitionResults, cfopCompetitionRooms, cfopCompetitionRounds, cfopPasswordResetTokens, InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, name: user.name ?? null, email: user.email ?? null, loginMethod: user.loginMethod ?? null, lastSignedIn: user.lastSignedIn ?? new Date(), role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user") };
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: { name: values.name, email: values.email, loginMethod: values.loginMethod, lastSignedIn: values.lastSignedIn } });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
}

export async function findCfopAccountByEmail(email: string) {
  const db = await requireDb();
  return (await db.select().from(cfopAccounts).where(eq(cfopAccounts.email, email)).limit(1))[0];
}

export async function findCfopAccountById(id: number) {
  const db = await requireDb();
  return (await db.select().from(cfopAccounts).where(eq(cfopAccounts.id, id)).limit(1))[0];
}

export async function createCfopAccount(values: { email: string; displayName: string; passwordHash: string }) {
  const db = await requireDb();
  await db.insert(cfopAccounts).values(values);
  const account = await findCfopAccountByEmail(values.email);
  if (!account) throw new Error("Account creation did not return a row");
  return account;
}

export async function markCfopAccountSignedIn(accountId: number) {
  const db = await requireDb();
  await db.update(cfopAccounts).set({ lastSignedIn: new Date() }).where(eq(cfopAccounts.id, accountId));
}

export async function updateCfopAccountProfile(accountId: number, patch: { displayName: string; bio: string; goalMs: number | null }) {
  const db = await requireDb();
  await db.update(cfopAccounts).set({ ...patch, updatedAt: new Date() }).where(eq(cfopAccounts.id, accountId));
  const account = await findCfopAccountById(accountId);
  if (!account) throw new Error("Account not found after profile update");
  return account;
}

export async function updateCfopAccountAvatar(accountId: number, avatarUrl: string) {
  const db = await requireDb();
  await db.update(cfopAccounts).set({ avatarUrl, updatedAt: new Date() }).where(eq(cfopAccounts.id, accountId));
  const account = await findCfopAccountById(accountId);
  if (!account) throw new Error("Account not found after avatar update");
  return account;
}

export async function updateCfopAccountPassword(accountId: number, passwordHash: string) {
  const db = await requireDb();
  await db.update(cfopAccounts).set({ passwordHash, updatedAt: new Date() }).where(eq(cfopAccounts.id, accountId));
}

export async function createCfopAccountSession(accountId: number, tokenHash: string, expiresAt: Date) {
  const db = await requireDb();
  await db.delete(cfopAccountSessions).where(eq(cfopAccountSessions.accountId, accountId));
  await db.insert(cfopAccountSessions).values({ accountId, tokenHash, expiresAt, lastSeenAt: new Date() });
}

export async function findCfopAccountBySessionHash(tokenHash: string): Promise<CfopAccount | null> {
  const db = await getDb();
  if (!db) return null;
  const session = (await db.select().from(cfopAccountSessions).where(and(eq(cfopAccountSessions.tokenHash, tokenHash), gt(cfopAccountSessions.expiresAt, new Date()))).limit(1))[0];
  if (!session) return null;
  const account = (await db.select().from(cfopAccounts).where(eq(cfopAccounts.id, session.accountId)).limit(1))[0] ?? null;
  if (account) await db.update(cfopAccountSessions).set({ lastSeenAt: new Date() }).where(eq(cfopAccountSessions.id, session.id));
  return account;
}

export async function revokeCfopAccountSession(tokenHash: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cfopAccountSessions).where(eq(cfopAccountSessions.tokenHash, tokenHash));
}

export async function getCfopAccountCloudState(accountId: number) {
  const db = await requireDb();
  return (await db.select().from(cfopAccountCloudStates).where(eq(cfopAccountCloudStates.accountId, accountId)).limit(1))[0] ?? null;
}

export async function saveCfopAccountCloudState(accountId: number, payload: unknown) {
  const db = await requireDb();
  const updatedAt = new Date();
  await db.insert(cfopAccountCloudStates).values({ accountId, payload, version: 1, updatedAt }).onDuplicateKeyUpdate({ set: { payload, version: 1, updatedAt } });
  return getCfopAccountCloudState(accountId);
}

export async function createCfopPasswordResetToken(accountId: number, tokenHash: string, expiresAt: Date) {
  const db = await requireDb();
  await db.delete(cfopPasswordResetTokens).where(eq(cfopPasswordResetTokens.accountId, accountId));
  await db.insert(cfopPasswordResetTokens).values({ accountId, tokenHash, expiresAt });
}

export async function findCfopPasswordResetToken(tokenHash: string) {
  const db = await requireDb();
  return (await db.select().from(cfopPasswordResetTokens).where(and(eq(cfopPasswordResetTokens.tokenHash, tokenHash), gt(cfopPasswordResetTokens.expiresAt, new Date()))).limit(1))[0] ?? null;
}

export async function consumeCfopPasswordResetToken(tokenHash: string, passwordHash: string) {
  const db = await requireDb();
  const reset = await findCfopPasswordResetToken(tokenHash);
  if (!reset) return null;
  await db.update(cfopAccounts).set({ passwordHash, updatedAt: new Date() }).where(eq(cfopAccounts.id, reset.accountId));
  await db.delete(cfopAccountSessions).where(eq(cfopAccountSessions.accountId, reset.accountId));
  await db.delete(cfopPasswordResetTokens).where(eq(cfopPasswordResetTokens.id, reset.id));
  return findCfopAccountById(reset.accountId);
}

export async function createCompetitionRoom(values: { code: string; name: string; hostAccountId: number; maxPlayers: number }) {
  const db = await requireDb();
  await db.insert(cfopCompetitionRooms).values(values);
  const room = (await db.select().from(cfopCompetitionRooms).where(eq(cfopCompetitionRooms.code, values.code)).limit(1))[0];
  if (!room) throw new Error("Room creation did not return a row");
  await db.insert(cfopCompetitionMembers).values({ roomId: room.id, accountId: values.hostAccountId });
  return room;
}

export async function findCompetitionRoomByCode(code: string) {
  const db = await requireDb();
  return (await db.select().from(cfopCompetitionRooms).where(eq(cfopCompetitionRooms.code, code)).limit(1))[0] ?? null;
}

export async function findCompetitionMember(roomId: number, accountId: number) {
  const db = await requireDb();
  return (await db.select().from(cfopCompetitionMembers).where(and(eq(cfopCompetitionMembers.roomId, roomId), eq(cfopCompetitionMembers.accountId, accountId))).limit(1))[0] ?? null;
}

export async function joinCompetitionRoom(roomId: number, accountId: number) {
  const db = await requireDb();
  await db.insert(cfopCompetitionMembers).values({ roomId, accountId });
  return findCompetitionMember(roomId, accountId);
}

export async function leaveCompetitionRoom(roomId: number, accountId: number) {
  const db = await requireDb();
  await db.delete(cfopCompetitionMembers).where(and(eq(cfopCompetitionMembers.roomId, roomId), eq(cfopCompetitionMembers.accountId, accountId)));
}

export async function listCompetitionRoomsForAccount(accountId: number) {
  const db = await requireDb();
  return db.select({ room: cfopCompetitionRooms, joinedAt: cfopCompetitionMembers.joinedAt }).from(cfopCompetitionMembers).innerJoin(cfopCompetitionRooms, eq(cfopCompetitionMembers.roomId, cfopCompetitionRooms.id)).where(eq(cfopCompetitionMembers.accountId, accountId)).orderBy(desc(cfopCompetitionRooms.updatedAt));
}

export async function listCompetitionMembers(roomId: number) {
  const db = await requireDb();
  return db.select({ accountId: cfopCompetitionMembers.accountId, displayName: cfopAccounts.displayName, avatarUrl: cfopAccounts.avatarUrl, joinedAt: cfopCompetitionMembers.joinedAt }).from(cfopCompetitionMembers).innerJoin(cfopAccounts, eq(cfopCompetitionMembers.accountId, cfopAccounts.id)).where(eq(cfopCompetitionMembers.roomId, roomId)).orderBy(asc(cfopCompetitionMembers.joinedAt));
}

export async function getCompetitionActiveRound(roomId: number) {
  const db = await requireDb();
  return (await db.select().from(cfopCompetitionRounds).where(and(eq(cfopCompetitionRounds.roomId, roomId), eq(cfopCompetitionRounds.status, "active"))).orderBy(desc(cfopCompetitionRounds.sequence)).limit(1))[0] ?? null;
}

export async function startCompetitionRound(roomId: number, sequence: number, scramble: string) {
  const db = await requireDb();
  await db.insert(cfopCompetitionRounds).values({ roomId, sequence, scramble });
  const round = (await db.select().from(cfopCompetitionRounds).where(and(eq(cfopCompetitionRounds.roomId, roomId), eq(cfopCompetitionRounds.sequence, sequence))).limit(1))[0];
  if (!round) throw new Error("Round creation did not return a row");
  await db.update(cfopCompetitionRooms).set({ status: "active", currentRound: sequence, updatedAt: new Date() }).where(eq(cfopCompetitionRooms.id, roomId));
  return round;
}

export async function finishCompetitionRound(roundId: number) {
  const db = await requireDb();
  await db.update(cfopCompetitionRounds).set({ status: "finished", completedAt: new Date() }).where(eq(cfopCompetitionRounds.id, roundId));
}

export async function findCompetitionResult(roundId: number, accountId: number) {
  const db = await requireDb();
  return (await db.select().from(cfopCompetitionResults).where(and(eq(cfopCompetitionResults.roundId, roundId), eq(cfopCompetitionResults.accountId, accountId))).limit(1))[0] ?? null;
}

export async function submitCompetitionResult(values: { roundId: number; accountId: number; elapsedMs: number; inspectionMs: number; penalty: "none" | "+2" | "DNF" }) {
  const db = await requireDb();
  await db.insert(cfopCompetitionResults).values(values);
  return findCompetitionResult(values.roundId, values.accountId);
}

export async function listCompetitionResults(roomId: number) {
  const db = await requireDb();
  return db.select({ roundSequence: cfopCompetitionRounds.sequence, roundId: cfopCompetitionRounds.id, accountId: cfopCompetitionResults.accountId, displayName: cfopAccounts.displayName, avatarUrl: cfopAccounts.avatarUrl, elapsedMs: cfopCompetitionResults.elapsedMs, inspectionMs: cfopCompetitionResults.inspectionMs, penalty: cfopCompetitionResults.penalty, submittedAt: cfopCompetitionResults.submittedAt }).from(cfopCompetitionResults).innerJoin(cfopCompetitionRounds, eq(cfopCompetitionResults.roundId, cfopCompetitionRounds.id)).innerJoin(cfopAccounts, eq(cfopCompetitionResults.accountId, cfopAccounts.id)).where(eq(cfopCompetitionRounds.roomId, roomId)).orderBy(asc(cfopCompetitionRounds.sequence), asc(cfopCompetitionResults.submittedAt));
}
