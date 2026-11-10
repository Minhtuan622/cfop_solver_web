import type { Express } from "express";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { json, urlencoded } from "express";

/**
 * The largest body an ordinary request may carry.
 *
 * Parsing is what an unauthenticated visitor can make the server do for free,
 * so the default stays small; the procedures that carry real content raise it
 * by name below.
 */
export const DEFAULT_BODY_LIMIT = "100kb";

/**
 * The largest body the two content-bearing procedures may send.
 *
 * An avatar is a 2 MB file written as base64 (about 2.7 MB), and one cloud
 * sync save carries the whole local history, so one limit covers both.
 */
export const LARGE_BODY_LIMIT = "4mb";

/** The tRPC procedures whose input can be large. */
const LARGE_BODY_PROCEDURES = ["cfopAccount.uploadAvatar", "cfopAccount.cloudState.save"] as const;

/** The part of an HTTP path that names the tRPC procedures it calls. */
const TRPC_PROCEDURES_PREFIX = "/api/trpc/";

/** The sentence for an upload nobody may send. */
export const OVERSIZED_BODY_MESSAGE = "Dữ liệu gửi lên quá lớn.";

/**
 * The json limit one request path needs.
 *
 * A tRPC call names its procedures in its path, several of them when the
 * client batches work: `/api/trpc/cfopAccount.uploadAvatar,cfopAccount.me`.
 * The large limit applies when any named procedure carries content.
 */
export function jsonBodyLimit(path: string | undefined): string {
  if (!path || !path.startsWith(TRPC_PROCEDURES_PREFIX)) return DEFAULT_BODY_LIMIT;
  const procedures = path.slice(TRPC_PROCEDURES_PREFIX.length).split(",");
  return procedures.some((procedure) => LARGE_BODY_PROCEDURES.includes(procedure as (typeof LARGE_BODY_PROCEDURES)[number]))
    ? LARGE_BODY_LIMIT
    : DEFAULT_BODY_LIMIT;
}

/** Parses the body of a request with the limit its procedures need. */
const limitedJsonParser: RequestHandler = (req, res, next) => {
  json({ limit: jsonBodyLimit(req.path) })(req, res, next);
};

/** Answers a too-large upload with one JSON sentence, not an HTML page. */
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

/** Applies the body limits of the API. */
export function applyBodyLimits(app: Express): void {
  app.use(limitedJsonParser);
  app.use(urlencoded({ limit: DEFAULT_BODY_LIMIT, extended: true }));
  app.use(oversizedBodyResponder);
}
