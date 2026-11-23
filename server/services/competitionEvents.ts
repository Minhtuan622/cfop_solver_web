import type { Express, Request, Response } from "express";
import {
  findCompetitionMember,
  findCompetitionRoomByCode,
  touchCompetitionMember,
} from "../db";
import { normalizeRoomCode } from "../routers/competitionShared";
import { getCfopAccountFromRequest } from "./cfopAccountAuth";
import {
  acquireCompetitionStream,
  releaseCompetitionStream,
  subscribeCompetitionEvents,
  type CompetitionEvent,
} from "./competitionEventBus";

/** Nhịp tim: giữ kết nối qua proxy và cập nhật hiện diện của thành viên. */
export const COMPETITION_HEARTBEAT_MS = 15_000;

function firstQueryValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function writeEvent(res: Response, name: string, data: unknown) {
  res.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * `GET /api/competition/events?code=ABC123`: luồng Server-Sent Events báo
 * phòng thi vừa thay đổi. Cần đăng nhập và phải là thành viên chưa bị loại.
 *
 * Kết nối cũng thay cho polling để cập nhật hiện diện: mỗi nhịp tim server
 * ghi `lastSeen` của thành viên, nên client chỉ cần hỏi lại thưa.
 */
export function registerCompetitionEventRoutes(app: Express) {
  app.get("/api/competition/events", async (req: Request, res: Response) => {
    const account = await getCfopAccountFromRequest(req).catch(() => null);
    if (!account) {
      res.status(401).json({ message: "unauthorized" });
      return;
    }
    const code = normalizeRoomCode(firstQueryValue(req.query.code));
    const room = code ? await findCompetitionRoomByCode(code) : null;
    if (!room) {
      res.status(404).json({ message: "room_not_found" });
      return;
    }
    const membership = await findCompetitionMember(room.id, account.id);
    if (!membership || membership.removedAt) {
      res.status(403).json({ message: "not_a_member" });
      return;
    }
    if (!acquireCompetitionStream(account.id)) {
      res.status(429).json({ message: "too_many_streams" });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      // `no-transform` để `compression()` không đệm luồng; `X-Accel-Buffering`
      // để nginx (nếu có) không đệm.
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    req.socket.setKeepAlive(true);
    res.write("retry: 3000\n\n");
    writeEvent(res, "ready", { roomId: room.id });

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      clearInterval(heartbeat);
      unsubscribe();
      releaseCompetitionStream(account.id);
      res.end();
    };

    const onEvent = (event: CompetitionEvent) => {
      if (closed) return;
      writeEvent(res, "change", event);
      // Bị loại khỏi phòng thì đóng luồng: không nhận thêm thay đổi nào nữa.
      if (event.type === "member" || event.type === "room") {
        void findCompetitionMember(room.id, account.id)
          .then(current => {
            if (!current || current.removedAt) {
              writeEvent(res, "closed", { reason: "removed" });
              close();
            }
          })
          .catch(() => undefined);
      }
    };
    const unsubscribe = subscribeCompetitionEvents(room.id, onEvent);
    const heartbeat = setInterval(() => {
      if (closed) return;
      res.write(": ping\n\n");
      void touchCompetitionMember(room.id, account.id).catch(() => undefined);
    }, COMPETITION_HEARTBEAT_MS);

    req.on("close", close);
    res.on("error", close);
  });
}
