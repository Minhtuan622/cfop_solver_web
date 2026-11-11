import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import compression from "compression";
import { registerStorageProxy } from "./storageProxy";
import { registerWcaOAuthRoutes } from "../services/wcaOAuthRoutes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./vite";
import { applyBodyLimits } from "./bodyLimits";
import { configureProxyTrust } from "./proxy";
import { securityHeaders } from "./securityHeaders";
import { databaseReady } from "../db/core";

dotenv.config();
// The host environment is the authority: a `PORT=3200` on the command line or
// from the platform must beat a value written into .env.local, so no key here
// overrides what is already set.
dotenv.config({ path: ".env.local" });

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Never advertise the stack in production responses.
  app.disable("x-powered-by");
  // Secure default headers; the CSP below starts report-only so nothing is
  // blocked while we learn what the app and its visitors actually load.
  app.use(securityHeaders());
  app.use(compression());
  // Elders behind a reverse proxy set TRUST_PROXY, so req.protocol follows
  // the X-Forwarded-* headers the proxy wrote (cookies, redirects).
  configureProxyTrust(app, process.env.TRUST_PROXY);
  // Bodies are limited per procedure: default small, larger only where
  // content is carried — see server/_core/bodyLimits.
  applyBodyLimits(app);
  app.get("/_app/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });
  // The process-level probe a platform restarts from: it passes when the
  // database answers, and fails so the platform can roll the deploy back.
  app.get("/_app/ready", (_req, res) => {
    databaseReady().then((ready) => {
      if (ready) return res.status(200).json({ ok: true, database: true });
      res.status(503).json({ ok: false, database: false });
    });
  });
  registerStorageProxy(app);
  registerWcaOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );
  // Unknown /api/* paths answer JSON instead of the HTML fallback page.
  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "Không tìm thấy." });
  });
  // development mode uses Vite, production mode uses static files. The dev
  // middleware loads on demand so a production bundle needs no vite package.
  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
