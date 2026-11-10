import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDb } from "./core";
import {
  createCfopAccount,
  createCfopAccountSession,
  createCfopPasswordResetToken,
  consumeCfopPasswordResetToken,
  findCfopAccountBySessionHash,
  MAX_SESSIONS_PER_ACCOUNT,
  revokeOtherCfopAccountSessions,
  updateCfopAccountPassword,
} from "./account";
import { cfopAccountSessions, cfopAccounts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword, hashSessionToken } from "../services/cfopAccountAuth";

/**
 * B1: nhiều phiên đăng nhập cùng tài khoản.
 *
 * Trước sửa: `createCfopAccountSession` xoá tất cả session cũ, nên đăng nhập
 * thiết bị B làm thiết bị A mất phiên. Sau sửa: giữ nhiều phiên, tối đa
 * MAX_SESSIONS_PER_ACCOUNT, đổi mật khẩu thu hồi session khác (giữ hiện tại).
 */
describe.skipIf(!process.env.DATABASE_URL)("multiple sessions per CFOP account", () => {
  let accountId: number;
  const expiresIn30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  beforeAll(async () => {
    const account = await createCfopAccount({
      email: `b1-multisession-${Date.now()}@example.com`,
      displayName: "B1 đa phiên",
      passwordHash: await hashPassword("mật-khẩu-có-ít-nhất-10-ký-tự"),
    });
    accountId = account.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (db) {
      await db.delete(cfopAccountSessions).where(eq(cfopAccountSessions.accountId, accountId));
      await db.delete(cfopAccounts).where(eq(cfopAccounts.id, accountId));
    }
  });

  it("hai thiết bị đăng nhập cùng tài khoản đều còn phiên", async () => {
    const hashA = hashSessionToken("thiết-bị-a-token");
    const hashB = hashSessionToken("thiết-bị-b-token");

    await createCfopAccountSession(accountId, hashA, expiresIn30Days);
    await createCfopAccountSession(accountId, hashB, expiresIn30Days);

    const sessionA = await findCfopAccountBySessionHash(hashA);
    const sessionB = await findCfopAccountBySessionHash(hashB);

    expect(sessionA?.id).toBe(accountId);
    expect(sessionB?.id).toBe(accountId);
  });

  it("giới hạn số session, xoá phiên cũ nhất khi vượt mức", async () => {
    const hashes: string[] = [];
    for (let i = 0; i < MAX_SESSIONS_PER_ACCOUNT + 2; i += 1) {
      const h = hashSessionToken(`cap-token-${i}`);
      hashes.push(h);
      await createCfopAccountSession(accountId, h, expiresIn30Days);
    }

    // Hai phiên đầu tiên đã bị xoá vì quá cũ (vượt mức cho phép).
    expect(await findCfopAccountBySessionHash(hashes[0]!)).toBeNull();
    expect(await findCfopAccountBySessionHash(hashes[1]!)).toBeNull();

    // Các phiên sau vẫn còn.
    for (let i = 2; i < hashes.length; i += 1) {
      expect(await findCfopAccountBySessionHash(hashes[i]!)).not.toBeNull();
    }
  });

  it("đổi mật khẩu giữ phiên hiện tại, thu hồi các phiên khác", async () => {
    const keepHash = hashSessionToken("giữ-lại-này");
    const dropHash = hashSessionToken("thu-hồi-này");

    await createCfopAccountSession(accountId, keepHash, expiresIn30Days);
    await createCfopAccountSession(accountId, dropHash, expiresIn30Days);

    await updateCfopAccountPassword(
      accountId,
      await hashPassword("mật-khẩu-mới-có-10-ký-tự"),
      keepHash,
    );

    expect(await findCfopAccountBySessionHash(keepHash)).not.toBeNull();
    expect(await findCfopAccountBySessionHash(dropHash)).toBeNull();
  });

  it("đặt lại mật khẩu thu hồi mọi phiên của tài khoản", async () => {
    const hashA = hashSessionToken("reset-a");
    const hashB = hashSessionToken("reset-b");

    await createCfopAccountSession(accountId, hashA, expiresIn30Days);
    await createCfopAccountSession(accountId, hashB, expiresIn30Days);

    const tokenHash = hashSessionToken("reset-token-hash");
    await createCfopPasswordResetToken(accountId, tokenHash, expiresIn30Days);

    const account = await consumeCfopPasswordResetToken(
      tokenHash,
      await hashPassword("mật-khẩu-sau-reset-10-ký-tự"),
    );
    expect(account?.id).toBe(accountId);

    // Cả hai phiên cũ đều bị thu hồi.
    expect(await findCfopAccountBySessionHash(hashA)).toBeNull();
    expect(await findCfopAccountBySessionHash(hashB)).toBeNull();
  });
});
