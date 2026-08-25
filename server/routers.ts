import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { clearCfopAccountBrowserSession, createCfopAccountBrowserSession, hashPassword, normalizeEmail, toPublicCfopAccount, verifyPassword } from "./cfopAccountAuth";
import { createCfopAccount, findCfopAccountByEmail, markCfopAccountSignedIn } from "./db";

const credentialsInput = z.object({
  email: z.string().trim().email("Email không hợp lệ.").max(320),
  password: z.string().min(10, "Mật khẩu cần ít nhất 10 ký tự.").max(128, "Mật khẩu quá dài."),
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
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
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
