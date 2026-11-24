import type { Express } from "express";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { json, urlencoded } from "express";

export const DEFAULT_BODY_LIMIT = "100kb";

export const LARGE_BODY_LIMIT = "4mb";

const LARGE_BODY_PROCEDURES = ["cfopAccount.uploadAvatar", "cfopAccount.cloudState.save"] as const;

const TRPC_PROCEDURES_PREFIX = "/api/trpc/";

export const OVERSIZED_BODY_MESSAGE = "Dữ liệu gửi lên quá lớn.";

export function jsonBodyLimit(path: string | undefined): string {
  if (!path || !path.startsWith(TRPC_PROCEDURES_PREFIX)) return DEFAULT_BODY_LIMIT;
  const procedures = path.slice(TRPC_PROCEDURES_PREFIX.length).split(",");
  return procedures.some((procedure) => LARGE_BODY_PROCEDURES.includes(procedure as (typeof LARGE_BODY_PROCEDURES)[number]))
    ? LARGE_BODY_LIMIT
    : DEFAULT_BODY_LIMIT;
}

const limitedJsonParser: RequestHandler = (req, res, next) => {
  json({ limit: jsonBodyLimit(req.path) })(req, res, next);
};

const oversizedBodyResponder: (error: unknown, req: Request, res: Response, next: NextFunction) => void = (
  error,
  _req,
  res,
  next,
) => {
  if (error instanceof Error && (error as { type?: unknown }).type === "entity.too.large") {
    res.status(413).json({ message: OVERSIZED_BODY_MESSAGE });
    return;
  }
  next(error);
};

export function applyBodyLimits(app: Express): void {
  app.use(limitedJsonParser);
  app.use(urlencoded({ limit: DEFAULT_BODY_LIMIT, extended: true }));
  app.use(oversizedBodyResponder);
}
