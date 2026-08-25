import { and, eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { CfopAccount, cfopAccounts, cfopAccountSessions, InsertUser, users } from "../drizzle/schema";
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
