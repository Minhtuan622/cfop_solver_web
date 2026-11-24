import type { Express } from "express";

export function proxyConfigured(settings: string | undefined): boolean {
  const value = settings?.trim().toLowerCase();
  return Boolean(settings?.trim()) && value !== "false" && value !== "0";
}

export function proxyTrustValue(
  settings: string | undefined
): boolean | number | string | string[] {
  const value = settings?.trim();
  if (value && /^\d+$/.test(value)) return parseInt(value, 10);
  const lowered = value?.toLowerCase();
  if (lowered === "true") return true;
  if (lowered === "loopback") return "loopback";
  return (value ?? "")
    .split(",")
    .map(address => address.trim())
    .filter(Boolean);
}

export function configureProxyTrust(
  app: Express,
  settings: string | undefined
): void {
  if (proxyConfigured(settings))
    app.set("trust proxy", proxyTrustValue(settings));
}

export function proxyTrustEnabled(): boolean {
  return proxyConfigured(process.env.TRUST_PROXY);
}
