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

export const UNEXPECTED_ERROR_MESSAGE = "Có lỗi xảy ra, vui lòng thử lại.";

export const VALIDATION_ERROR_PREFIX = "Dữ liệu không hợp lệ:";

function restatesCause(error: TRPCError): boolean {
  if (error.cause == null) return false;
  const causeMessage = (error.cause as { message?: unknown }).message;
  return (
    error.message ===
    (typeof causeMessage === "string" ? causeMessage : undefined)
  );
}

function firstSchemaIssue(
  error: TRPCError
): { path: string; message: string } | null {
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

function visitorMessage(error: TRPCError): string {
  if (error.code === "INTERNAL_SERVER_ERROR" && restatesCause(error))
    return UNEXPECTED_ERROR_MESSAGE;
  const issue = firstSchemaIssue(error);
  if (!issue) return error.message;
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
    const { stack: _stack, ...data } = shape.data;
    return { ...shape, message, data };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const authRateLimiter = new RateLimiter();

const MINUTE = 60 * 1000;

export const AUTH_RATE_LIMITS = {
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
  resetPassword: {
    address: { limit: 20, windowMs: 15 * MINUTE },
    subject: null,
  },
} as const satisfies Record<
  string,
  { address: RateLimitRule; subject: RateLimitRule | null }
>;

export type AuthRateLimitAction = keyof typeof AUTH_RATE_LIMITS;

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
