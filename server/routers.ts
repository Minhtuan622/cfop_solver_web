import { TRPCError } from "@trpc/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { COOKIE_NAME } from "../shared/const";
import { clearCfopAccountBrowserSession, createCfopAccountBrowserSession, hashPassword, hashSessionToken, normalizeEmail, toPublicCfopAccount, verifyPassword } from "./cfopAccountAuth";
import { passwordResetEmailConfigured, sendCfopPasswordResetEmail } from "./cfopPasswordResetMail";
import { consumeCfopPasswordResetToken, createCfopAccount, createCfopPasswordResetToken, findCfopAccountByEmail, getCfopAccountCloudState, markCfopAccountSignedIn, saveCfopAccountCloudState, updateCfopAccountPassword, updateCfopAccountProfile } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { cfopAccountProcedure, publicProcedure, router } from "./_core/trpc";

const passwordInput = z.string().min(10, "Mật khẩu cần ít nhất 10 ký tự.").max(128, "Mật khẩu quá dài.");
const credentialsInput = z.object({ email: z.string().trim().email("Email không hợp lệ.").max(320), password: passwordInput });
const profileInput = z.object({ displayName: z.string().trim().min(2, "Tên hiển thị cần ít nhất 2 ký tự.").max(80), bio: z.string().trim().max(280, "Giới thiệu tối đa 280 ký tự.") });
const cloudStateInput = z.object({
  schema: z.literal("cfop-account-cloud-state"),
  version: z.literal(1),
  capturedAt: z.number().int().nonnegative(),
  timer: z.array(z.unknown()).max(500),
  lastLayer: z.object({ study: z.unknown(), masteredCaseKeys: z.array(z.string().max(120)).max(1800) }),
  bldProfile: z.unknown(),
  bldLearningPath: z.unknown(),
});

function validateCloudPayload(payload: unknown) {
  const size = Buffer.byteLength(JSON.stringify(payload), "utf8");
  if (size > 1_500_000) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Dữ liệu đồng bộ quá lớn. Hãy xuất backup cục bộ trước." });
  return payload;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  cfopAccount: router({
    me: publicProcedure.query(({ ctx }) => ctx.cfopAccount),
    register: publicProcedure.input(credentialsInput.extend({ displayName: z.string().trim().min(2, "Tên hiển thị cần ít nhất 2 ký tự.").max(80) })).mutation(async ({ ctx, input }) => {
      const email = normalizeEmail(input.email);
      if (await findCfopAccountByEmail(email)) throw new TRPCError({ code: "CONFLICT", message: "Email này đã có tài khoản CFOP." });
      const account = await createCfopAccount({ email, displayName: input.displayName, passwordHash: await hashPassword(input.password) });
      await createCfopAccountBrowserSession(ctx.req, ctx.res, account.id);
      return toPublicCfopAccount(account);
    }),
    login: publicProcedure.input(credentialsInput).mutation(async ({ ctx, input }) => {
      const account = await findCfopAccountByEmail(normalizeEmail(input.email));
      if (!account || !(await verifyPassword(input.password, account.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email hoặc mật khẩu không đúng." });
      await markCfopAccountSignedIn(account.id);
      await createCfopAccountBrowserSession(ctx.req, ctx.res, account.id);
      return toPublicCfopAccount({ ...account, lastSignedIn: new Date() });
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      await clearCfopAccountBrowserSession(ctx.req, ctx.res);
      return { success: true } as const;
    }),
    profile: cfopAccountProcedure.query(({ ctx }) => ctx.cfopAccount),
    updateProfile: cfopAccountProcedure.input(profileInput).mutation(async ({ ctx, input }) => toPublicCfopAccount(await updateCfopAccountProfile(ctx.cfopAccount.id, input))),
    cloudState: router({
      get: cfopAccountProcedure.query(async ({ ctx }) => {
        const state = await getCfopAccountCloudState(ctx.cfopAccount.id);
        return state ? { payload: state.payload, updatedAt: state.updatedAt } : null;
      }),
      save: cfopAccountProcedure.input(cloudStateInput).mutation(async ({ ctx, input }) => {
        const state = await saveCfopAccountCloudState(ctx.cfopAccount.id, validateCloudPayload(input));
        return { updatedAt: state?.updatedAt ?? new Date() };
      }),
    }),
    changePassword: cfopAccountProcedure.input(z.object({ currentPassword: passwordInput, newPassword: passwordInput })).mutation(async ({ ctx, input }) => {
      const account = await findCfopAccountByEmail(ctx.cfopAccount.email);
      if (!account || !(await verifyPassword(input.currentPassword, account.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "Mật khẩu hiện tại không đúng." });
      await updateCfopAccountPassword(account.id, await hashPassword(input.newPassword));
      await createCfopAccountBrowserSession(ctx.req, ctx.res, account.id);
      return { success: true } as const;
    }),
    requestPasswordReset: publicProcedure.input(z.object({ email: z.string().trim().email("Email không hợp lệ.").max(320) })).mutation(async ({ input }) => {
      const account = await findCfopAccountByEmail(normalizeEmail(input.email));
      if (account && passwordResetEmailConfigured()) {
        const rawToken = randomBytes(32).toString("base64url");
        await createCfopPasswordResetToken(account.id, hashSessionToken(rawToken), new Date(Date.now() + 30 * 60 * 1000));
        try { await sendCfopPasswordResetEmail({ email: account.email, displayName: account.displayName, resetToken: rawToken }); } catch (error) { console.error("[CFOP] Password reset email failed", error); }
      }
      return { success: true, emailConfigured: passwordResetEmailConfigured() } as const;
    }),
    resetPassword: publicProcedure.input(z.object({ token: z.string().min(32).max(160), newPassword: passwordInput })).mutation(async ({ ctx, input }) => {
      const account = await consumeCfopPasswordResetToken(hashSessionToken(input.token), await hashPassword(input.newPassword));
      if (!account) throw new TRPCError({ code: "BAD_REQUEST", message: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." });
      await createCfopAccountBrowserSession(ctx.req, ctx.res, account.id);
      return toPublicCfopAccount(account);
    }),
  }),
});

export type AppRouter = typeof appRouter;
