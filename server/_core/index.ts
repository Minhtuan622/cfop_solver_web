import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import compression from "compression";
import { registerStorageProxy } from "./storageProxy";
import { registerWcaOAuthRoutes } from "../services/wcaOAuthRoutes";
import { registerCompetitionEventRoutes } from "../services/competitionEvents";
import { startReminderScheduler } from "../services/pushReminders";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./vite";
import { applyBodyLimits } from "./bodyLimits";
import { configureProxyTrust } from "./proxy";
import { securityHeaders } from "./securityHeaders";
import { databaseReady } from "../db/core";

dotenv.config();
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
  app.disable("x-powered-by");
  app.use(securityHeaders());
  app.use(compression());
  configureProxyTrust(app, process.env.TRUST_PROXY);
  applyBodyLimits(app);
  app.get("/_app/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });
  app.get("/_app/ready", (_req, res) => {
    databaseReady().then((ready) => {
      if (ready) return res.status(200).json({ ok: true, database: true });
      res.status(503).json({ ok: false, database: false });
    });
  });
  registerStorageProxy(app);
  registerWcaOAuthRoutes(app);
  registerCompetitionEventRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );
  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "Không tìm thấy." });
  });
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
  if (startReminderScheduler()) console.log("[Push] Review reminders enabled.");
}

startServer().catch(console.error);
