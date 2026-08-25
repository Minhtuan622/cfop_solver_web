import { TRPCError } from "@trpc/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { COOKIE_NAME } from "../shared/const";
import { clearCfopAccountBrowserSession, createCfopAccountBrowserSession, hashPassword, hashSessionToken, normalizeEmail, toPublicCfopAccount, verifyPassword } from "./cfopAccountAuth";
import { passwordResetEmailConfigured, sendCfopPasswordResetEmail } from "./cfopPasswordResetMail";
import { consumeCfopPasswordResetToken, createCfopAccount, createCfopPasswordResetToken, findCfopAccountByEmail, getCfopAccountCloudState, markCfopAccountSignedIn, saveCfopAccountCloudState, updateCfopAccountAvatar, updateCfopAccountPassword, updateCfopAccountProfile } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { cfopAccountProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";

const passwordInput = z.string().min(10, "Mật khẩu cần ít nhất 10 ký tự.").max(128, "Mật khẩu quá dài.");
const credentialsInput = z.object({ email: z.string().trim().email("Email không hợp lệ.").max(320), password: passwordInput });
const profileInput = z.object({ displayName: z.string().trim().min(2, "Tên hiển thị cần ít nhất 2 ký tự.").max(80), bio: z.string().trim().max(280, "Giới thiệu tối đa 280 ký tự."), goalMs: z.number().int().min(1_000, "Mục tiêu cần ít nhất 1 giây.").max(3_600_000, "Mục tiêu tối đa 60 phút.").nullable() });
const avatarInput = z.object({ data: z.string().min(8).max(2_800_000), contentType: z.enum(["image/jpeg", "image/png", "image/webp"]) });
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

function validateAvatarBytes(data: string, contentType: "image/jpeg" | "image/png" | "image/webp") {
  if (!/^[A-Za-z0-9+/=]+$/.test(data)) throw new TRPCError({ code: "BAD_REQUEST", message: "Ảnh đại diện không đúng định dạng." });
  const bytes = Buffer.from(data, "base64");
  if (!bytes.length || bytes.length > 2 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Ảnh đại diện phải nhỏ hơn 2 MB." });
  const png = bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const webp = bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  if ((contentType === "image/png" && !png) || (contentType === "image/jpeg" && !jpeg) || (contentType === "image/webp" && !webp)) throw new TRPCError({ code: "BAD_REQUEST", message: "Nội dung ảnh không khớp định dạng đã chọn." });
  return bytes;
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
    uploadAvatar: cfopAccountProcedure.input(avatarInput).mutation(async ({ ctx, input }) => {
      const bytes = validateAvatarBytes(input.data, input.contentType);
      const extension = input.contentType === "image/jpeg" ? "jpg" : input.contentType.slice("image/".length);
      const stored = await storagePut(`cfop-accounts/${ctx.cfopAccount.id}/avatar.${extension}`, bytes, input.contentType);
      return toPublicCfopAccount(await updateCfopAccountAvatar(ctx.cfopAccount.id, stored.url));
    }),
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
