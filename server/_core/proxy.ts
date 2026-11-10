import type { Express } from "express";

/**
 * How far the server trusts the proxy in front of it.
 *
 * `req.protocol` (and with it https cookies and build redirects) is told by
 * the `X-Forwarded-*` headers, which any caller may write. Express therefore
 * only reads them for the addresses `app.set("trust proxy")` names. The
 * setting arrives as `TRUST_PROXY`:
 *
 * - unset, `false` or `0` — no trust at all (the default for a direct host);
 * - `1`, `2`, ... — trust that many hops from the socket;
 * - `true` or `loopback` — trust the whole chain or only the local machine;
 * - a comma list — trust exactly those addresses or CIDR ranges.
 */
export function proxyConfigured(settings: string | undefined): boolean {
  const value = settings?.trim().toLowerCase();
  return Boolean(settings?.trim()) && value !== "false" && value !== "0";
}

/** The value `app.set("trust proxy")` takes for one `TRUST_PROXY` setting. */
export function proxyTrustValue(settings: string | undefined): boolean | number | string | string[] {
  const value = settings?.trim();
  if (value && /^\d+$/.test(value)) return parseInt(value, 10);
  const lowered = value?.toLowerCase();
  if (lowered === "true") return true;
  if (lowered === "loopback") return "loopback";
  return (value ?? "").split(",").map((address) => address.trim()).filter(Boolean);
}

/** Applies `TRUST_PROXY`; leave it unset when the server is exposed directly. */
export function configureProxyTrust(app: Express, settings: string | undefined): void {
  if (proxyConfigured(settings)) app.set("trust proxy", proxyTrustValue(settings));
}
