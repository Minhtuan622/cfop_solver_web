import { afterAll, beforeAll, describe, expect, it } from "vitest";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("A1: cloud state theo revision của dòng", () => {
  let accountId = 0;
  let save: (
    accountId: number,
    payload: unknown,
    expectedRevision?: number | null
  ) => Promise<{ version: number } | null>;
  let read: (
    accountId: number
  ) => Promise<{ version: number; payload: unknown } | null>;
  let removeAccount: (accountId: number) => Promise<void>;

  const payloadWith = (ids: string[]) => ({
    schema: "cfop-account-cloud-state",
    schemaVersion: 2,
    capturedAt: Date.now(),
    timer: ids.map(id => ({ id })),
    lastLayer: { study: { records: {}, dailyGoal: 0 }, masteredCaseKeys: [] },
    bldProfile: {},
    bldLearningPath: {},
  });

  const timerIds = (payload: unknown): string[] =>
    ((payload as { timer?: { id: string }[] })?.timer ?? [])
      .map(entry => entry.id)
      .sort();

  beforeAll(async () => {
    const db = await import("../db");
    const schema = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const core = await import("../db/core");
    const database = await core.requireDb();
    const account = await db.createCfopAccount({
      email: `cloud-revision-${Date.now()}@example.test`,
      displayName: "Cloud Revision",
      passwordHash: "not-a-real-hash",
    });
    accountId = account.id;
    save = db.saveCfopAccountCloudState as typeof save;
    read = db.getCfopAccountCloudState as typeof read;
    removeAccount = async (id: number) => {
      await database
        .delete(schema.cfopAccounts)
        .where(eq(schema.cfopAccounts.id, id));
    };
  });

  afterAll(async () => {
    if (accountId) await removeAccount(accountId);
  });

  it("hai thiết bị không ghi đè dữ liệu của nhau", async () => {
    const first = await save(accountId, payloadWith(["s1"]), null);
    expect(first?.version).toBe(1);

    const seen = await read(accountId);
    expect(seen?.version).toBe(1);

    const second = await save(
      accountId,
      payloadWith(["s1", "s2"]),
      seen?.version
    );
    expect(second?.version).toBe(2);

    await expect(
      save(accountId, payloadWith(["s1"]), seen?.version)
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });

    const fresh = await read(accountId);
    expect(fresh?.version).toBe(2);
    const merged = payloadWith(
      Array.from(
        new Set([...timerIds(fresh?.payload), ...timerIds(payloadWith(["s1"]))])
      ).sort()
    );
    const third = await save(accountId, merged, fresh?.version);
    expect(third?.version).toBe(3);

    const final = await read(accountId);
    expect(timerIds(final?.payload)).toEqual(["s1", "s2"]);
  });

  it("revision tăng sau mỗi lần ghi thành công", async () => {
    let revision = (await read(accountId))?.version ?? 0;
    for (let step = 0; step < 3; step += 1) {
      const next = await save(
        accountId,
        payloadWith([`step-${step}`]),
        revision
      );
      expect(next?.version).toBe(revision + 1);
      revision = next?.version ?? revision;
    }
  });

  it("lần lưu đầu tiên với baseVersion null vẫn thành công", async () => {
    const db = await import("../db");
    const schema = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const core = await import("../db/core");
    const database = await core.requireDb();
    const account = await db.createCfopAccount({
      email: `cloud-first-${Date.now()}@example.test`,
      displayName: "Cloud First",
      passwordHash: "not-a-real-hash",
    });
    try {
      const result = await save(account.id, payloadWith(["first"]), null);
      expect(result?.version).toBe(1);
      const stored = await read(account.id);
      expect(timerIds(stored?.payload)).toEqual(["first"]);
    } finally {
      await database
        .delete(schema.cfopAccounts)
        .where(eq(schema.cfopAccounts.id, account.id));
    }
  });
});
