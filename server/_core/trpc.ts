import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { serverMessageKeys } from "../../shared/serverMessages";
import {
  clientAddress,
  RateLimiter,
  type RateLimitRule,
} from "../infrastructure/rateLimit";
import { proxyTrustEnabled } from "./proxy";
import type { TrpcContext } from "./context";

/**
 * The wording a visitor reads when the server fails in a way no one planned.
 *
 * tRPC turns an unplanned throw into an internal error whose message is the
 * original text, so a failed query would print its SQL and the values it
 * touched. The formatter below replaces such a message with this sentence and
 * leaves the full detail in the server log.
 */
export const UNEXPECTED_ERROR_MESSAGE = "Có lỗi xảy ra, vui lòng thử lại.";

/**
 * The prefix of a schema validation failure.
 *
 * A rejected form used to answer with the whole zod payload printed as a JSON
 * array. The formatter reduces it to this prefix plus the first field's own
 * sentence, which the interface catalogue can translate.
 */
export const VALIDATION_ERROR_PREFIX = "Dữ liệu không hợp lệ:";

/** Whether a caught error only restates the words of its original cause. */
function restatesCause(error: TRPCError): boolean {
  if (error.cause == null) return false;
  const causeMessage = (error.cause as { message?: unknown }).message;
  return (
    error.message ===
    (typeof causeMessage === "string" ? causeMessage : undefined)
  );
}

/** The first issue of a caught validation failure, as plain words. */
function firstSchemaIssue(
  error: TRPCError
): { path: string; message: string } | null {
  // The parser middleware wraps a failed schema check in a BAD_REQUEST whose
  // message is the raw text of the cause; a hand-thrown sentence never matches.
  if (error.code !== "BAD_REQUEST" || !restatesCause(error)) return null;
  const issues = (error.cause as { issues?: unknown }).issues;
  if (!Array.isArray(issues) || issues.length === 0) return null;
  const issue = issues.find(
    (candidate): candidate is { message?: unknown; path?: unknown } =>
      typeof candidate === "object" && candidate !== null
  );
  if (!issue || typeof issue.message !== "string" || !issue.message.trim())
    return null;
  const path = Array.isArray(issue.path)
    ? issue.path
        .filter(part => typeof part === "string" || typeof part === "number")
        .join(".")
    : "";
  return { path, message: issue.message.trim() };
}

/**
 * The words of an error the visitor may read.
 *
 * A planned failure — thrown as a `TRPCError` with its own sentence — keeps
 * that sentence. A failed schema check becomes one short line instead of a
 * raw array. Everything else, usually a database error tRPC caught, gets only
 * the generic sentence; the original wording goes to the server log.
 */
function visitorMessage(error: TRPCError): string {
  if (error.code === "INTERNAL_SERVER_ERROR" && restatesCause(error))
    return UNEXPECTED_ERROR_MESSAGE;
  const issue = firstSchemaIssue(error);
  if (!issue) return error.message;
  // A sentence the catalogue already lists, such as "Email không hợp lệ.",
  // reads on its own; a raw wording needs the field name to point at.
  const named = Object.hasOwn(serverMessageKeys, issue.message);
  const detail =
    !named && issue.path ? `${issue.path}: ${issue.message}` : issue.message;
  return `${VALIDATION_ERROR_PREFIX} ${detail}`;
}

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error, path }) => {
    const message = visitorMessage(error);
    if (message !== error.message) {
      console.error(
        `[trpc] hidden error detail in "${path ?? "unknown"}":`,
        error.cause ?? error
      );
    }
    // The stack is a detail of the server, never of the visitor; the logged
    // copy above keeps it. Code, HTTP status and the procedure path stay.
    const { stack: _stack, ...data } = shape.data;
    return { ...shape, message, data };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Shared limiter for the unauthenticated auth endpoints.
 *
 * Every action is guarded by two independent buckets:
 *
 * - `address` counts attempts coming from one client address, which stops a
 *   single host from spraying many accounts.
 * - `subject` counts attempts aimed at one account across every address, so
 *   rotating the source address does not buy an attacker more guesses.
 *
 * A request has to fit in both buckets to go through.
 */
export const authRateLimiter = new RateLimiter();

const MINUTE = 60 * 1000;

export const AUTH_RATE_LIMITS = {
  /**
   * The account bucket is the real brute force guard, so it stays tight.
   * The address bucket is only a backstop against spraying many accounts, and
   * is loose enough that a club, school or office behind one shared IP can
   * still sign several people in at once.
   */
  login: {
    address: { limit: 60, windowMs: 15 * MINUTE },
    subject: { limit: 10, windowMs: 15 * MINUTE },
  },
  register: {
    address: { limit: 30, windowMs: 60 * MINUTE },
    subject: { limit: 5, windowMs: 60 * MINUTE },
  },
  requestPasswordReset: {
    address: { limit: 20, windowMs: 60 * MINUTE },
    subject: { limit: 5, windowMs: 60 * MINUTE },
  },
  /** A reset carries a token rather than an email, so only the address bucket applies. */
  resetPassword: {
    address: { limit: 20, windowMs: 15 * MINUTE },
    subject: null,
  },
} as const satisfies Record<
  string,
  { address: RateLimitRule; subject: RateLimitRule | null }
>;

export type AuthRateLimitAction = keyof typeof AUTH_RATE_LIMITS;

/**
 * Builds a middleware that limits one auth action.
 *
 * `subject` picks what the account bucket is keyed on: an email address lets
 * the limiter slow a targeted guessing run. An empty subject means the action
 * carries no account identifier and only the address bucket applies.
 */
export function rateLimitMiddleware<TAction extends AuthRateLimitAction>(
  action: TAction,
  subject: (input: unknown) => string
) {
  const rules = AUTH_RATE_LIMITS[action];
  return t.middleware(async ({ ctx, input, next }) => {
    const address = clientAddress(
      ctx.req as {
        headers: Record<string, string | string[] | undefined>;
        socket?: { remoteAddress?: string };
      },
      proxyTrustEnabled()
    );
    const target = subject(input);

    const buckets: { key: string; rule: RateLimitRule }[] = [
      { key: `${action}:address:${address}`, rule: rules.address },
    ];
    if (rules.subject && target)
      buckets.push({ key: `${action}:subject:${target}`, rule: rules.subject });

    // The headers report the tightest bucket, which is the one a caller hits first.
    let tightest: { limit: number; remaining: number } | null = null;

    for (const bucket of buckets) {
      const result = authRateLimiter.consume(bucket.key, bucket.rule);

      if (!result.allowed) {
        ctx.res.setHeader("X-RateLimit-Limit", String(result.limit));
        ctx.res.setHeader("X-RateLimit-Remaining", "0");
        ctx.res.setHeader(
          "Retry-After",
          String(Math.ceil(result.retryAfterMs / 1000))
        );
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.",
        });
      }

      if (!tightest || result.remaining < tightest.remaining)
        tightest = { limit: result.limit, remaining: result.remaining };
    }

    if (tightest) {
      ctx.res.setHeader("X-RateLimit-Limit", String(tightest.limit));
      ctx.res.setHeader("X-RateLimit-Remaining", String(tightest.remaining));
    }

    return next();
  });
}

export const cfopAccountProcedure = t.procedure.use(
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.cfopAccount)
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "CFOP_ACCOUNT_REQUIRED",
      });
    return next({ ctx: { ...ctx, cfopAccount: ctx.cfopAccount } });
  })
);
