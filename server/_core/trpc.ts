import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { clientAddress, RateLimiter, type RateLimitRule } from "../infrastructure/rateLimit";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
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
  login: { address: { limit: 60, windowMs: 15 * MINUTE }, subject: { limit: 10, windowMs: 15 * MINUTE } },
  register: { address: { limit: 30, windowMs: 60 * MINUTE }, subject: { limit: 5, windowMs: 60 * MINUTE } },
  requestPasswordReset: { address: { limit: 20, windowMs: 60 * MINUTE }, subject: { limit: 5, windowMs: 60 * MINUTE } },
  /** A reset carries a token rather than an email, so only the address bucket applies. */
  resetPassword: { address: { limit: 20, windowMs: 15 * MINUTE }, subject: null },
} as const satisfies Record<string, { address: RateLimitRule; subject: RateLimitRule | null }>;

export type AuthRateLimitAction = keyof typeof AUTH_RATE_LIMITS;

/**
 * Builds a middleware that limits one auth action.
 *
 * `subject` picks what the account bucket is keyed on: an email address lets
 * the limiter slow a targeted guessing run. An empty subject means the action
 * carries no account identifier and only the address bucket applies.
 */
export function rateLimitMiddleware<TAction extends AuthRateLimitAction>(action: TAction, subject: (input: unknown) => string) {
  const rules = AUTH_RATE_LIMITS[action];
  return t.middleware(async ({ ctx, input, next }) => {
    const address = clientAddress(ctx.req as { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } });
    const target = subject(input);

    const buckets: { key: string; rule: RateLimitRule }[] = [{ key: `${action}:address:${address}`, rule: rules.address }];
    if (rules.subject && target) buckets.push({ key: `${action}:subject:${target}`, rule: rules.subject });

    // The headers report the tightest bucket, which is the one a caller hits first.
    let tightest: { limit: number; remaining: number } | null = null;

    for (const bucket of buckets) {
      const result = authRateLimiter.consume(bucket.key, bucket.rule);

      if (!result.allowed) {
        ctx.res.setHeader("X-RateLimit-Limit", String(result.limit));
        ctx.res.setHeader("X-RateLimit-Remaining", "0");
        ctx.res.setHeader("Retry-After", String(Math.ceil(result.retryAfterMs / 1000)));
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.",
        });
      }

      if (!tightest || result.remaining < tightest.remaining) tightest = { limit: result.limit, remaining: result.remaining };
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
    if (!ctx.cfopAccount) throw new TRPCError({ code: "UNAUTHORIZED", message: "CFOP_ACCOUNT_REQUIRED" });
    return next({ ctx: { ...ctx, cfopAccount: ctx.cfopAccount } });
  }),
);
