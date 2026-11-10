import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import express from "express";
import { createServer, type Server } from "node:http";
import { DEFAULT_BODY_LIMIT, LARGE_BODY_LIMIT, applyBodyLimits, jsonBodyLimit } from "./_core/bodyLimits";

describe("the body limit of a request path", () => {
  it("stays small for every route that carries no user content", () => {
    expect(jsonBodyLimit("/api/trpc/cfopAccount.login")).toBe(DEFAULT_BODY_LIMIT);
    expect(jsonBodyLimit("/api/trpc/wca.competitions")).toBe(DEFAULT_BODY_LIMIT);
    expect(jsonBodyLimit("/api/trpc")).toBe(DEFAULT_BODY_LIMIT);
    expect(jsonBodyLimit("/avatar-upload")).toBe(DEFAULT_BODY_LIMIT);
    expect(jsonBodyLimit(undefined)).toBe(DEFAULT_BODY_LIMIT);
  });

  it("raises the limit for the procedures that carry user content", () => {
    expect(jsonBodyLimit("/api/trpc/cfopAccount.uploadAvatar")).toBe(LARGE_BODY_LIMIT);
    expect(jsonBodyLimit("/api/trpc/cfopAccount.cloudState.save")).toBe(LARGE_BODY_LIMIT);
  });

  it("raises the limit when a batched call names one large procedure", () => {
    expect(jsonBodyLimit("/api/trpc/cfopAccount.uploadAvatar,cfopAccount.me")).toBe(LARGE_BODY_LIMIT);
    expect(jsonBodyLimit("/api/trpc/cfopAccount.login,cfopAccount.me")).toBe(DEFAULT_BODY_LIMIT);
  });
});

describe("the body parser of the API", () => {
  let server: Server;
  let port: number;

  beforeAll(() => {
    const app = express();
    applyBodyLimits(app);
    // A stand-in for a tRPC procedure: the parsed body ends the request.
    app.post("/api/trpc/cfopAccount.login", (_req, res) => {
      res.json({ ok: true });
    });
    app.use("/api/trpc", (_req, res) => {
      res.json({ ok: true });
    });
    server = createServer(app);
    server.listen(0);
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  });

  it("answers a 30 MB anonymous login packet with 413 and one JSON sentence", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/trpc/cfopAccount.login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ padding: "x".repeat(30 * 1024 * 1024) }),
    });
    expect(response.status).toBe(413);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.text()).resolves.not.toContain("x".repeat(1024));
  });

  it("still reads a body the default limit allows", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/trpc/cfopAccount.login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "a@example.com" }),
    });
    expect(response.status).toBe(200);
  });

  it("refuses a 5 MB packet on the login path the large procedures only reserve", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/trpc/cfopAccount.login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ padding: "y".repeat(5 * 1024 * 1024) }),
    });
    expect(response.status).toBe(413);
  });
});
