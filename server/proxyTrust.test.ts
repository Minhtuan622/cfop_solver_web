import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import express from "express";
import { createServer, type Server } from "node:http";
import { configureProxyTrust, proxyConfigured, proxyTrustValue } from "./_core/proxy";

describe("the TRUST_PROXY setting", () => {
  it("stays off unless the host wrote something real", () => {
    expect(proxyConfigured(undefined)).toBe(false);
    expect(proxyConfigured("")).toBe(false);
    expect(proxyConfigured("false")).toBe(false);
    expect(proxyConfigured("0")).toBe(false);
    expect(proxyConfigured("true")).toBe(true);
    expect(proxyConfigured("2")).toBe(true);
  });

  it("reads hops, the loopback word and address lists", () => {
    expect(proxyTrustValue("2")).toBe(2);
    expect(proxyTrustValue("true")).toBe(true);
    expect(proxyTrustValue("loopback")).toBe("loopback");
    expect(proxyTrustValue("10.0.0.1, 10.0.0.0/8")).toEqual(["10.0.0.1", "10.0.0.0/8"]);
    expect(proxyTrustValue(undefined)).toEqual([]);
  });
});

describe("the address of a redirect behind a proxy", () => {
  let trusted: Server;
  let untrusted: Server;
  let trustedPort: number;
  let untrustedPort: number;

  beforeAll(async () => {
    const build = (trust: string | undefined, route: (app: express.Express) => void) => {
      const app = express();
      configureProxyTrust(app, trust);
      route(app);
      const server = createServer(app);
      server.listen(0);
      return server;
    };

    // The callback the WCA flow returns to, simplified to its shape.
    const callback = (req: express.Request, res: express.Response) => {
      const origin = new URL(req.originalUrl, `${req.protocol}://${req.get("host")}`).origin;
      res.json({ redirect: `${origin}/profile?wca=linked`, secure: req.secure });
    };

    trusted = build("true", (app) => app.get("/api/wca/oauth/callback", callback));
    untrusted = build(undefined, (app) => app.get("/api/wca/oauth/callback", callback));

    await Promise.all([
      new Promise<void>((resolve) => trusted.on("listening", () => resolve())),
      new Promise<void>((resolve) => untrusted.on("listening", () => resolve())),
    ]);
    trustedPort = (trusted.address() as AddressInfo).port;
    untrustedPort = (untrusted.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await Promise.all(
      [trusted, untrusted].filter((server) => server !== undefined).map((server) => {
        const wait = new Promise<void>((resolve) => {
          server!.close(() => resolve());
          if (typeof server!.closeAllConnections === "function") server!.closeAllConnections();
        });
        return Promise.race([wait, new Promise<void>((_, reject) => setTimeout(() => reject(new Error("server close hung")), 5000))]);
      }),
    );
  });

  it("trusts the forwarded protocol of the proxy when TRUST_PROXY is on", async () => {
    const response = await fetch(`http://127.0.0.1:${trustedPort}/api/wca/oauth/callback`, {
      headers: { "x-forwarded-proto": "https", connection: "close" },
    });
    const httpBody = (await response.json()) as { redirect: string };

    expect(response.status).toBe(200);
    expect(httpBody.redirect.startsWith("https://")).toBe(true);
  });

  it("ignores the same header from an anonymous caller without TRUST_PROXY", async () => {
    const response = await fetch(`http://127.0.0.1:${untrustedPort}/api/wca/oauth/callback`, {
      headers: { "x-forwarded-proto": "https", connection: "close" },
    });
    const httpBody = (await response.json()) as { redirect: string };

    expect(httpBody.redirect.startsWith("http://")).toBe(true);
  });

  it("answers a direct https socket with an http redirect", async () => {
    const response = await fetch(`http://127.0.0.1:${trustedPort}/api/wca/oauth/callback`, {
      headers: { connection: "close" },
    });
    const httpBody = (await response.json()) as { redirect: string };

    expect(httpBody.redirect.startsWith("http://")).toBe(true);
  });
});
