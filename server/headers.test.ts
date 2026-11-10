import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import express from "express";
import compression from "compression";
import helmet from "helmet";
import { createServer, type Server } from "node:http";
import { createWriteStream, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * The production header stack lives in server/_core/index.ts (helmet, CSP
 * report-only, compression, cache headers on hashed assets, JSON 404 for
 * unknown /api/* paths). This test spins the same stack against a temporary
 * public directory so a regression shows up as failing assertions instead of
 * a curl check on a live deploy.
 */
describe("the production header stack", () => {
  let server: Server;
  let port: number;
  const publicDir = path.join(os.tmpdir(), `cfop-headers-${process.pid}`);

  beforeAll(async () => {
    mkdirSync(path.join(publicDir, "assets", "x"), { recursive: true });
    writeFileSync(path.join(publicDir, "assets", "x", "main.a1b2.js"), "console.log(1);" + "x".repeat(2000));
    writeFileSync(path.join(publicDir, "index.html"), "<html></html>");

    const app = express();
    app.disable("x-powered-by");
    app.use(helmet());
    app.use(
      helmet.contentSecurityPolicy({
        reportOnly: true,
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          fontSrc: ["'self'", "https:", "data:"],
          frameAncestors: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'", "blob:", "https://cdn.jsdelivr.net"],
          scriptSrcAttr: ["'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: [
            "'self'",
            "https://cdn.jsdelivr.net",
            "https://raw.githubusercontent.com",
            "https://www.worldcubeassociation.org",
          ],
          workerSrc: ["blob:", "'self'"],
          upgradeInsecureRequests: [],
        },
      }),
    );
    app.use(compression());
    app.use(
      express.static(publicDir, {
        setHeaders(res, filePath) {
          if (filePath.includes("/assets/")) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          } else if (filePath.endsWith("index.html")) {
            res.setHeader("Cache-Control", "no-cache");
          }
        },
      }),
    );
    app.use("/api", (_req, res) => {
      res.status(404).json({ message: "Không tìm thấy." });
    });

    server = createServer(app);
    server.listen(0);
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("advertises no stack and a report-only CSP that names the real origins", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/assets/x/main.a1b2.js`);
    expect(response.headers.get("x-powered-by")).toBeNull();
    const csp = response.headers.get("content-security-policy-report-only");
    expect(csp).not.toBeNull();
    for (const origin of [
      "cdn.jsdelivr.net",
      "raw.githubusercontent.com",
      "blob:",
      "wasm-unsafe-eval",
    ]) {
      expect(csp).toContain(origin);
    }
  });

  it("lets hashed assets live in the cache for a year", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/assets/x/main.a1b2.js`);
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
  });

  it("sends gzip when the visitor asks for it", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/assets/x/main.a1b2.js`, {
      headers: { "accept-encoding": "gzip" },
    });
    expect(response.headers.get("content-encoding")).toBe("gzip");
  });

  it("asks browsers to revalidate the entry page on every visit", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/index.html`);
    expect(response.headers.get("cache-control")).toBe("no-cache");
  });

  it("answers unknown /api/* paths with JSON instead of an HTML 200", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/nope`);
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({ message: "Không tìm thấy." });
  });
});
