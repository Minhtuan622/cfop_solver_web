import express from "express";
import { createServer, request, type Server } from "http";
import type { AddressInfo } from "net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  account: { id: 5 } as { id: number } | null,
  room: { id: 11, code: "ABC123" } as { id: number; code: string } | null,
  member: { removedAt: null } as { removedAt: Date | null } | null,
}));

vi.mock("./services/cfopAccountAuth", () => ({
  getCfopAccountFromRequest: async () => state.account,
}));
vi.mock("./db", () => ({
  findCompetitionRoomByCode: async () => state.room,
  findCompetitionMember: async () => state.member,
  touchCompetitionMember: async () => undefined,
}));
vi.mock("./routers/competitionShared", () => ({
  normalizeRoomCode: (value: string) => value.trim().toUpperCase(),
}));

import { registerCompetitionEventRoutes } from "./services/competitionEvents";
import {
  publishCompetitionEvent,
  resetCompetitionEventBus,
} from "./services/competitionEventBus";

let server: Server;
let port = 0;

beforeEach(async () => {
  state.account = { id: 5 };
  state.room = { id: 11, code: "ABC123" };
  state.member = { removedAt: null };
  const app = express();
  registerCompetitionEventRoutes(app);
  server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, resolve));
  port = (server.address() as AddressInfo).port;
});

afterEach(async () => {
  resetCompetitionEventBus();
  server.closeAllConnections();
  await new Promise<void>(resolve => server.close(() => resolve()));
});

function get(path: string) {
  return new Promise<{ status: number; headers: Record<string, unknown>; body: string }>(
    resolve => {
      const req = request({ port, path }, res => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", chunk => (body += chunk));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
      });
      req.end();
    }
  );
}

describe("GET /api/competition/events", () => {
  it("rejects anonymous visitors", async () => {
    state.account = null;
    expect((await get("/api/competition/events?code=ABC123")).status).toBe(401);
  });

  it("answers 404 for an unknown room and 403 for a non-member", async () => {
    state.room = null;
    expect((await get("/api/competition/events?code=NOPE")).status).toBe(404);
    state.room = { id: 11, code: "ABC123" };
    state.member = null;
    expect((await get("/api/competition/events?code=ABC123")).status).toBe(403);
  });

  it("streams a ready event, then changes published for the room", async () => {
    const chunks: string[] = [];
    const headers = await new Promise<Record<string, unknown>>(resolve => {
      const req = request(
        { port, path: "/api/competition/events?code=ABC123" },
        res => {
          res.setEncoding("utf8");
          res.on("data", chunk => chunks.push(chunk));
          resolve(res.headers);
        }
      );
      req.end();
    });
    expect(String(headers["content-type"])).toContain("text/event-stream");
    expect(String(headers["cache-control"])).toContain("no-transform");
    await vi.waitFor(() => expect(chunks.join("")).toContain("event: ready"));
    publishCompetitionEvent(11, "result");
    await vi.waitFor(() => expect(chunks.join("")).toContain("event: change"));
    expect(chunks.join("")).toContain('"type":"result"');
  });
});
