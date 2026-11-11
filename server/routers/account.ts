import { TRPCError } from "@trpc/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { clearCfopAccountBrowserSession, createCfopAccountBrowserSession, currentSessionTokenHash, hashPassword, hashSessionToken, normalizeEmail, verifyPassword } from "../services/cfopAccountAuth";
import { passwordResetEmailConfigured, sendCfopPasswordResetEmail } from "../services/cfopPasswordResetMail";
import { createCfopAccount, createCfopPasswordResetToken, consumeCfopPasswordResetToken, findCfopAccountByEmail, findCfopAccountPublicById, getCfopAccountCloudState, markCfopAccountSignedIn, saveCfopAccountCloudState, updateCfopAccountAvatar, updateCfopAccountPassword, updateCfopAccountProfile } from "../db";
import { cfopAccountProcedure, publicProcedure, rateLimitMiddleware, router } from "../_core/trpc";
import { storagePut, isStorageEnabled } from "../services/storage";
import { accountWcaRouter } from "./wca";
import { avatarInput, cloudStateInput, credentialsInput, passwordInput, profileInput } from "./inputs";

/**
 * Rate limit bucket subject for the email based auth endpoints.
 *
 * The address is normalized so `A@x.com` and `a@x.com` share one bucket.
 * Anything that is not a usable email falls back to the address alone, which
 * the limiter already mixes into the key.
 */
function emailSubject(input: unknown) {
  const email = (input as { email?: unknown } | null)?.email;
  if (typeof email !== "string" || !email.trim()) return "";
  return normalizeEmail(email);
}

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

export const accountRouter = router({
  me: publicProcedure.query(async ({ ctx }) => ctx.cfopAccount ? findCfopAccountPublicById(ctx.cfopAccount.id) : null),
  storageStatus: publicProcedure.query(() => ({ enabled: isStorageEnabled() })),
  register: publicProcedure.input(credentialsInput.extend({ displayName: z.string().trim().min(2, "Tên hiển thị cần ít nhất 2 ký tự.").max(80) })).use(rateLimitMiddleware("register", (input) => emailSubject(input))).mutation(async ({ ctx, input }) => {
    const email = normalizeEmail(input.email);
    if (await findCfopAccountByEmail(email)) throw new TRPCError({ code: "CONFLICT", message: "Email này đã có tài khoản CFOP." });
    const account = await createCfopAccount({ email, displayName: input.displayName, passwordHash: await hashPassword(input.password) });
    await createCfopAccountBrowserSession(ctx.req, ctx.res, account.id);
    return findCfopAccountPublicById(account.id);
  }),
  login: publicProcedure.input(credentialsInput).use(rateLimitMiddleware("login", (input) => emailSubject(input))).mutation(async ({ ctx, input }) => {
    const account = await findCfopAccountByEmail(normalizeEmail(input.email));
    if (!account || !(await verifyPassword(input.password, account.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email hoặc mật khẩu không đúng." });
    await markCfopAccountSignedIn(account.id);
    await createCfopAccountBrowserSession(ctx.req, ctx.res, account.id);
    return findCfopAccountPublicById(account.id);
  }),
  logout: publicProcedure.mutation(async ({ ctx }) => { await clearCfopAccountBrowserSession(ctx.req, ctx.res); return { success: true } as const; }),
  profile: cfopAccountProcedure.query(async ({ ctx }) => findCfopAccountPublicById(ctx.cfopAccount.id)),
  updateProfile: cfopAccountProcedure.input(profileInput).mutation(async ({ ctx, input }) => { await updateCfopAccountProfile(ctx.cfopAccount.id, input); return findCfopAccountPublicById(ctx.cfopAccount.id); }),
  uploadAvatar: cfopAccountProcedure.input(avatarInput).mutation(async ({ ctx, input }) => {
    const bytes = validateAvatarBytes(input.data, input.contentType);
    const extension = input.contentType === "image/jpeg" ? "jpg" : input.contentType.slice("image/".length);
    try {
      const stored = await storagePut(`cfop-accounts/${ctx.cfopAccount.id}/avatar.${extension}`, bytes, input.contentType);
      await updateCfopAccountAvatar(ctx.cfopAccount.id, stored.url);
      return findCfopAccountPublicById(ctx.cfopAccount.id);
    } catch (error) {
      if ((error as { code?: string })?.code === "PRECONDITION_FAILED") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: (error as Error).message });
      }
      throw error;
    }
  }),
  cloudState: router({
    get: cfopAccountProcedure.query(async ({ ctx }) => { const state = await getCfopAccountCloudState(ctx.cfopAccount.id); return state ? { payload: state.payload, updatedAt: state.updatedAt, revision: state.version } : null; }),
    save: cfopAccountProcedure.input(cloudStateInput).mutation(async ({ ctx, input }) => {
      try {
        // `baseVersion` là revision của dòng mà client đã đọc, do client gửi
        // lên. Máy chủ so với revision hiện tại: lệch thì báo CONFLICT chứ
        // không ghi, để client đọc bản mới, gộp rồi lưu lại.
        const state = await saveCfopAccountCloudState(ctx.cfopAccount.id, validateCloudPayload(input), input.baseVersion);
        return { updatedAt: state?.updatedAt ?? new Date(), revision: state?.version ?? 0 };
      } catch (error) {
        if ((error as { code?: string }).code === "CONFLICT") {
          throw new TRPCError({ code: "CONFLICT", message: "Trạng thái đám mây đã được cập nhật ở thiết bị khác. Hãy tải lại và đồng bộ lại." });
        }
        throw error;
      }
    }),
  }),
  changePassword: cfopAccountProcedure.input(z.object({ currentPassword: passwordInput, newPassword: passwordInput })).mutation(async ({ ctx, input }) => {
    const account = await findCfopAccountByEmail(ctx.cfopAccount.email);
    if (!account || !(await verifyPassword(input.currentPassword, account.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "Mật khẩu hiện tại không đúng." });
    await updateCfopAccountPassword(account.id, await hashPassword(input.newPassword), currentSessionTokenHash(ctx.req));
    return { success: true } as const;
  }),
  requestPasswordReset: publicProcedure.input(z.object({ email: z.string().trim().email("Email không hợp lệ.").max(320) })).use(rateLimitMiddleware("requestPasswordReset", (input) => emailSubject(input))).mutation(async ({ input }) => {
    const account = await findCfopAccountByEmail(normalizeEmail(input.email));
    if (account && passwordResetEmailConfigured()) {
      const rawToken = randomBytes(32).toString("base64url");
      await createCfopPasswordResetToken(account.id, hashSessionToken(rawToken), new Date(Date.now() + 30 * 60 * 1000));
      try { await sendCfopPasswordResetEmail({ email: account.email, displayName: account.displayName, resetToken: rawToken }); } catch (error) { console.error("[CFOP] Password reset email failed", error); }
    }
    return { success: true, emailConfigured: passwordResetEmailConfigured() } as const;
  }),
  resetPassword: publicProcedure.input(z.object({ token: z.string().min(32).max(160), newPassword: passwordInput })).use(rateLimitMiddleware("resetPassword", () => "")).mutation(async ({ ctx, input }) => {
    const account = await consumeCfopPasswordResetToken(hashSessionToken(input.token), await hashPassword(input.newPassword));
    if (!account) throw new TRPCError({ code: "BAD_REQUEST", message: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." });
    await createCfopAccountBrowserSession(ctx.req, ctx.res, account.id);
    return findCfopAccountPublicById(account.id);
  }),
  wca: accountWcaRouter,
});
