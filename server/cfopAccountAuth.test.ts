import { describe, expect, it } from "vitest";
import { cfopAccountCookieOptions, hashPassword, hashSessionToken, normalizeEmail, verifyPassword } from "./cfopAccountAuth";

describe("CFOP native account security helpers", () => {
  it("normalizes email consistently", () => {
    expect(normalizeEmail("  Cuber@Example.COM ")).toBe("cuber@example.com");
  });

  it("hashes and verifies passwords without preserving plaintext", async () => {
    const hash = await hashPassword("secure-cfop-password");
    expect(hash).toContain("scrypt$");
    expect(hash).not.toContain("secure-cfop-password");
    await expect(verifyPassword("secure-cfop-password", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("hashes browser session tokens deterministically", () => {
    expect(hashSessionToken("token-a")).toHaveLength(64);
    expect(hashSessionToken("token-a")).toBe(hashSessionToken("token-a"));
    expect(hashSessionToken("token-a")).not.toBe(hashSessionToken("token-b"));
  });

  it("uses a protected first-party session cookie", () => {
    const options = cfopAccountCookieOptions({ protocol: "http", headers: {} } as never);
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", secure: false, path: "/" });
  });
});
