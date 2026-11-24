import { and, asc, eq, gt, isNotNull, lte, or, isNull, lt, sql } from "drizzle-orm";
import { cfopPushSubscriptions } from "../../drizzle/schema";
import { requireDb } from "./core";

export type PushSubscriptionInput = {
  accountId: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  tzOffsetMinutes: number;
};

export async function upsertPushSubscription(input: PushSubscriptionInput) {
  const db = await requireDb();
  await db
    .insert(cfopPushSubscriptions)
    .values(input)
    .onDuplicateKeyUpdate({
      set: {
        accountId: input.accountId,
        p256dh: input.p256dh,
        auth: input.auth,
        tzOffsetMinutes: input.tzOffsetMinutes,
        nextDueAt: null,
        dueCount: 0,
        lastNotifiedAt: null,
      },
    });
}

export async function countPushSubscriptions(accountId: number) {
  const db = await requireDb();
  const [row] = await db
    .select({ total: sql<number>`count(*)` })
    .from(cfopPushSubscriptions)
    .where(eq(cfopPushSubscriptions.accountId, accountId));
  return Number(row?.total ?? 0);
}

export async function findPushSubscription(accountId: number, endpoint: string) {
  const db = await requireDb();
  return (
    (
      await db
        .select()
        .from(cfopPushSubscriptions)
        .where(
          and(
            eq(cfopPushSubscriptions.accountId, accountId),
            eq(cfopPushSubscriptions.endpoint, endpoint)
          )
        )
        .limit(1)
    )[0] ?? null
  );
}

export async function deletePushSubscription(accountId: number, endpoint: string) {
  const db = await requireDb();
  await db
    .delete(cfopPushSubscriptions)
    .where(
      and(
        eq(cfopPushSubscriptions.accountId, accountId),
        eq(cfopPushSubscriptions.endpoint, endpoint)
      )
    );
}

export async function deletePushSubscriptionById(id: number) {
  const db = await requireDb();
  await db.delete(cfopPushSubscriptions).where(eq(cfopPushSubscriptions.id, id));
}

export async function updatePushSchedule(
  accountId: number,
  endpoint: string,
  schedule: { nextDueAt: number | null; dueCount: number; tzOffsetMinutes: number }
) {
  const db = await requireDb();
  await db
    .update(cfopPushSubscriptions)
    .set(schedule)
    .where(
      and(
        eq(cfopPushSubscriptions.accountId, accountId),
        eq(cfopPushSubscriptions.endpoint, endpoint)
      )
    );
}

export async function listDuePushSubscriptions(now: number, limit = 200) {
  const db = await requireDb();
  return db
    .select()
    .from(cfopPushSubscriptions)
    .where(
      and(
        isNotNull(cfopPushSubscriptions.nextDueAt),
        lte(cfopPushSubscriptions.nextDueAt, now),
        gt(cfopPushSubscriptions.dueCount, 0),
        or(
          isNull(cfopPushSubscriptions.lastNotifiedAt),
          lt(cfopPushSubscriptions.lastNotifiedAt, cfopPushSubscriptions.nextDueAt)
        )
      )
    )
    .orderBy(asc(cfopPushSubscriptions.nextDueAt))
    .limit(limit);
}

export async function markPushNotified(id: number, now: number) {
  const db = await requireDb();
  await db
    .update(cfopPushSubscriptions)
    .set({ lastNotifiedAt: now })
    .where(eq(cfopPushSubscriptions.id, id));
}
