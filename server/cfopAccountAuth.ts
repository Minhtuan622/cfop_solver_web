import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { parse } from "cookie";
import type { Request, Response } from "express";
import type { CfopAccount } from "../drizzle/schema";
import { createCfopAccountSession, findCfopAccountBySessionHash, revokeCfopAccountSession } from "./db";

const HASH_PREFIX = "scrypt";
const HASH_PARAMS = { N: 16_384, r: 8, p: 1, keyLength: 64 };
const SESSION_DAYS = 30;
export const CFOP_ACCOUNT_COOKIE = "cfop_account_session";

export type PublicCfopAccount = Pick<CfopAccount, "id" | "email" | "displayName" | "createdAt" | "lastSignedIn">;

function derivePasswordKey(password: string, salt: string, N: number, r: number, p: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, HASH_PARAMS.keyLength, { N, r, p, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error); else resolve(key as Buffer);
    });
  });
}

export function toPublicCfopAccount(account: CfopAccount): PublicCfopAccount {
  return { id: account.id, email: account.email, displayName: account.displayName, createdAt: account.createdAt, lastSignedIn: account.lastSignedIn };
}

export function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase("en-US");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = await derivePasswordKey(password, salt, HASH_PARAMS.N, HASH_PARAMS.r, HASH_PARAMS.p);
  return [HASH_PREFIX, HASH_PARAMS.N, HASH_PARAMS.r, HASH_PARAMS.p, salt, derived.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, encoded: string) {
  const [prefix, n, r, p, salt, expected] = encoded.split("$");
  if (prefix !== HASH_PREFIX || !salt || !expected) return false;
  const N = Number(n), R = Number(r), P = Number(p);
  if (![N, R, P].every(Number.isSafeInteger)) return false;
  const actual = await derivePasswordKey(password, salt, N, R, P);
  const expectedBuffer = Buffer.from(expected, "base64url");
  return expectedBuffer.length === actual.length && timingSafeEqual(expectedBuffer, actual);
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;
  const forwarded = req.headers["x-forwarded-proto"];
  return typeof forwarded === "string" && forwarded.split(",").some((value) => value.trim() === "https");
}

export function cfopAccountCookieOptions(req: Request) {
  return { httpOnly: true, path: "/", sameSite: "lax" as const, secure: isSecureRequest(req), maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000 };
}

export async function createCfopAccountBrowserSession(req: Request, res: Response, accountId: number) {
  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await createCfopAccountSession(accountId, hashSessionToken(rawToken), expiresAt);
  res.cookie(CFOP_ACCOUNT_COOKIE, rawToken, cfopAccountCookieOptions(req));
}

export async function getCfopAccountFromRequest(req: Request) {
  const rawToken = parse(req.headers.cookie ?? "")[CFOP_ACCOUNT_COOKIE];
  if (!rawToken) return null;
  return findCfopAccountBySessionHash(hashSessionToken(rawToken));
}

export async function clearCfopAccountBrowserSession(req: Request, res: Response) {
  const rawToken = parse(req.headers.cookie ?? "")[CFOP_ACCOUNT_COOKIE];
  if (rawToken) await revokeCfopAccountSession(hashSessionToken(rawToken));
  res.clearCookie(CFOP_ACCOUNT_COOKIE, { ...cfopAccountCookieOptions(req), maxAge: 0 });
}
