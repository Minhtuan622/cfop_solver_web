import { createHash, randomBytes } from "node:crypto";
import type { Request } from "express";
import { consumeCfopWcaOauthState, createCfopWcaOauthState, updateCfopAccountWcaId } from "../db";

const WCA_AUTHORIZE_URL = "https://www.worldcubeassociation.org/oauth/authorize";
const WCA_TOKEN_URL = "https://www.worldcubeassociation.org/oauth/token";
const WCA_ME_URL = "https://www.worldcubeassociation.org/api/v0/me";
const STATE_TTL_MS = 10 * 60 * 1000;

type WcaOauthConfig = { clientId: string; clientSecret: string; redirectUri: string };

export class WcaOAuthError extends Error {
  constructor(message: string, public readonly code: "NOT_CONFIGURED" | "INVALID_STATE" | "LINK_FAILED" | "ACCOUNT_MISMATCH") {
    super(message);
  }
}

function getConfig(): WcaOauthConfig | null {
  const clientId = process.env.WCA_CLIENT_ID?.trim();
  const clientSecret = process.env.WCA_CLIENT_SECRET?.trim();
  const redirectUri = process.env.WCA_OAUTH_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) return null;
  try {
    const callbackUrl = new URL(redirectUri);
    // HTTPS bắt buộc trên production. Cho phép http chỉ trên localhost/127.0.0.1
    // khi chưa chạy production (dev local).
    if (callbackUrl.protocol !== "https:") {
      const isLocalhost = callbackUrl.hostname === "localhost" || callbackUrl.hostname === "127.0.0.1";
      const isDev = process.env.NODE_ENV !== "production";
      if (!isLocalhost || !isDev) return null;
    }
  } catch {
    return null;
  }
  return { clientId, clientSecret, redirectUri };
}

function stateHash(state: string) {
  return createHash("sha256").update(state).digest("hex");
}

function normalizeWcaId(value: unknown) {
  const wcaId = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!/^\d{4}[A-Z]{4}\d{2}$/.test(wcaId)) throw new WcaOAuthError("WCA không trả về WCA ID hợp lệ.", "LINK_FAILED");
  return wcaId;
}

export function wcaOAuthConfigured() {
  return Boolean(getConfig());
}

export async function beginWcaOAuth(accountId: number) {
  const config = getConfig();
  if (!config) throw new WcaOAuthError("WCA OAuth chưa được cấu hình trên máy chủ.", "NOT_CONFIGURED");
  const state = randomBytes(32).toString("base64url");
  await createCfopWcaOauthState(accountId, stateHash(state), new Date(Date.now() + STATE_TTL_MS));
  const url = new URL(WCA_AUTHORIZE_URL);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "public");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function completeWcaOAuth(input: { code: string; state: string; activeAccountId: number }) {
  const config = getConfig();
  if (!config) throw new WcaOAuthError("WCA OAuth chưa được cấu hình trên máy chủ.", "NOT_CONFIGURED");
  const savedState = await consumeCfopWcaOauthState(stateHash(input.state));
  if (!savedState) throw new WcaOAuthError("Liên kết WCA đã hết hạn hoặc không hợp lệ.", "INVALID_STATE");
  if (savedState.accountId !== input.activeAccountId) throw new WcaOAuthError("Phiên tài khoản CFOP không khớp với yêu cầu liên kết WCA.", "ACCOUNT_MISMATCH");

  const payload = new URLSearchParams({ grant_type: "authorization_code", code: input.code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: config.redirectUri });
  let accessToken = "";
  try {
    const tokenResponse = await fetch(WCA_TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: payload });
    if (!tokenResponse.ok) throw new Error("token");
    const token = await tokenResponse.json() as { access_token?: unknown };
    accessToken = typeof token.access_token === "string" ? token.access_token : "";
    if (!accessToken) throw new Error("token");
    const meResponse = await fetch(WCA_ME_URL, { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } });
    if (!meResponse.ok) throw new Error("me");
    const me = await meResponse.json() as { me?: { wca_id?: unknown } };
    const wcaId = normalizeWcaId(me.me?.wca_id);
    const account = await updateCfopAccountWcaId(input.activeAccountId, wcaId);
    return { wcaId, account };
  } catch (error) {
    if (error instanceof WcaOAuthError) throw error;
    throw new WcaOAuthError("Không thể xác minh tài khoản WCA. Hãy thử liên kết lại.", "LINK_FAILED");
  } finally {
    accessToken = "";
  }
}

export function wcaOAuthCallbackReturnPath(req: Request, outcome: "linked" | "error") {
  const baseUrl = new URL(req.originalUrl, `${req.protocol}://${req.get("host")}`);
  return `${baseUrl.origin}/profile?wca=${outcome}`;
}
