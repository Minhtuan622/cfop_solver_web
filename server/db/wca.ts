import { and, eq, gt } from "drizzle-orm";
import { cfopWcaOauthStates } from "../../drizzle/schema";
import { requireDb } from "./core";

export async function createCfopWcaOauthState(accountId: number, stateHash: string, expiresAt: Date) {
  const db = await requireDb();
  await db.delete(cfopWcaOauthStates).where(eq(cfopWcaOauthStates.accountId, accountId));
  await db.insert(cfopWcaOauthStates).values({ accountId, stateHash, expiresAt });
}

export async function consumeCfopWcaOauthState(stateHash: string) {
  const db = await requireDb();
  const state = (await db.select().from(cfopWcaOauthStates).where(and(eq(cfopWcaOauthStates.stateHash, stateHash), gt(cfopWcaOauthStates.expiresAt, new Date()))).limit(1))[0] ?? null;
  if (!state) return null;
  await db.delete(cfopWcaOauthStates).where(eq(cfopWcaOauthStates.id, state.id));
  return state;
}
