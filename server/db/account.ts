import { and, eq, gt, lt, ne } from "drizzle-orm";
import { CfopAccount, cfopAccountCloudStates, cfopAccountSessions, cfopAccounts, cfopPasswordResetTokens, cfopWcaOauthStates } from "../../drizzle/schema";
import { requireDb, getDb } from "./core";
import { cfopAccountPublicSelect, cfopAccountWcaSelect } from "./accountSelectors";

export async function findCfopAccountByEmail(email: string) {
  const db = await requireDb();
  return (await db.select().from(cfopAccounts).where(eq(cfopAccounts.email, email)).limit(1))[0];
}

export async function findCfopAccountById(id: number) {
  const db = await requireDb();
  return (await db.select().from(cfopAccounts).where(eq(cfopAccounts.id, id)).limit(1))[0];
}

export async function findCfopAccountPublicById(id: number) {
  const db = await requireDb();
  return (await db.select(cfopAccountPublicSelect).from(cfopAccounts).where(eq(cfopAccounts.id, id)).limit(1))[0] ?? null;
}

export async function findCfopAccountWcaById(id: number) {
  const db = await requireDb();
  return (await db.select(cfopAccountWcaSelect).from(cfopAccounts).where(eq(cfopAccounts.id, id)).limit(1))[0] ?? null;
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

export async function updateCfopAccountWcaId(accountId: number, wcaId: string | null) {
  const db = await requireDb();
  await db.update(cfopAccounts).set({ wcaId, updatedAt: new Date() }).where(eq(cfopAccounts.id, accountId));
  const account = await findCfopAccountById(accountId);
  if (!account) throw new Error("Account not found after WCA update");
  return account;
}

export async function updateCfopAccountAvatar(accountId: number, avatarUrl: string) {
  const db = await requireDb();
  await db.update(cfopAccounts).set({ avatarUrl, updatedAt: new Date() }).where(eq(cfopAccounts.id, accountId));
  const account = await findCfopAccountById(accountId);
  if (!account) throw new Error("Account not found after avatar update");
  return account;
}

export async function updateCfopAccountPassword(accountId: number, passwordHash: string, keepTokenHash?: string | null) {
  const db = await requireDb();
  await db.update(cfopAccounts).set({ passwordHash, updatedAt: new Date() }).where(eq(cfopAccounts.id, accountId));
  // Đổi mật khẩu thu hồi mọi session khác, giữ session hiện tại nếu có.
  if (keepTokenHash) {
    await revokeOtherCfopAccountSessions(accountId, keepTokenHash);
  } else {
    await db.delete(cfopAccountSessions).where(eq(cfopAccountSessions.accountId, accountId));
  }
}

/** Tối đa số session đang hoạt động cùng lúc cho một tài khoản. */
export const MAX_SESSIONS_PER_ACCOUNT = 10;

export async function createCfopAccountSession(accountId: number, tokenHash: string, expiresAt: Date) {
  const db = await requireDb();
  const now = new Date();
  // Dọn phiên hết hạn của tài khoản này mỗi khi tạo phiên mới.
  await db.delete(cfopAccountSessions).where(and(eq(cfopAccountSessions.accountId, accountId), lt(cfopAccountSessions.expiresAt, now)));
  // Giữ tối đa MAX_SESSIONS_PER_ACCOUNT phiên: nếu đã đầy, xoá phiên cũ nhất trước khi tạo mới.
  const sessions = await db.select().from(cfopAccountSessions).where(eq(cfopAccountSessions.accountId, accountId)).orderBy(cfopAccountSessions.createdAt);
  while (sessions.length >= MAX_SESSIONS_PER_ACCOUNT) {
    await db.delete(cfopAccountSessions).where(eq(cfopAccountSessions.id, sessions[0]!.id));
    sessions.shift();
  }
  await db.insert(cfopAccountSessions).values({ accountId, tokenHash, expiresAt, lastSeenAt: new Date() });
}

/** Thu hồi mọi session của tài khoản, giữ lại session có tokenHash angegeben. */
export async function revokeOtherCfopAccountSessions(accountId: number, keepTokenHash: string) {
  const db = await requireDb();
  await db.delete(cfopAccountSessions).where(and(eq(cfopAccountSessions.accountId, accountId), ne(cfopAccountSessions.tokenHash, keepTokenHash)));
}

/** Thu hồi session, token đặt lại mật khẩu và trạng thái OAuth đã hết hạn trên toàn hệ thống. */
export async function cleanExpiredAuthData() {
  const now = new Date();
  const db = await requireDb();
  await db.delete(cfopAccountSessions).where(lt(cfopAccountSessions.expiresAt, now));
  await db.delete(cfopPasswordResetTokens).where(lt(cfopPasswordResetTokens.expiresAt, now));
  await db.delete(cfopWcaOauthStates).where(lt(cfopWcaOauthStates.expiresAt, now));
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
  // Đặt lại mật khẩu thu hồi mọi session của tài khoản; router sẽ tạo phiên mới sau.
  await db.delete(cfopAccountSessions).where(eq(cfopAccountSessions.accountId, reset.accountId));
  await db.delete(cfopPasswordResetTokens).where(eq(cfopPasswordResetTokens.id, reset.id));
  return findCfopAccountById(reset.accountId);
}
