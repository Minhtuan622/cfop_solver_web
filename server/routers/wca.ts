import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { cfopAccountProcedure, publicProcedure, router } from "../_core/trpc";
import { getWcaCompetitions, getWcaCountries, getWcaProfile, normalizeWcaId, WcaApiError } from "../wcaApi";
import { beginWcaOAuth, wcaOAuthConfigured, WcaOAuthError } from "../wcaOAuth";
import { findCfopAccountPublicById, findCfopAccountWcaById, updateCfopAccountWcaId } from "../db";
import { wcaCalendarInput, wcaIdInput } from "./inputs";

export function wcaError(error: unknown): never {
  if (error instanceof WcaApiError) throw new TRPCError({ code: error.kind === "NOT_FOUND" ? "NOT_FOUND" : "SERVICE_UNAVAILABLE", message: error.message });
  if (error instanceof WcaOAuthError) throw new TRPCError({ code: error.code === "NOT_CONFIGURED" ? "PRECONDITION_FAILED" : "BAD_REQUEST", message: error.message });
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể xử lý dữ liệu WCA." });
}

export const accountWcaRouter = router({
  profile: cfopAccountProcedure.query(async ({ ctx }) => {
    const account = await findCfopAccountWcaById(ctx.cfopAccount.id);
    if (!account?.wcaId) return null;
    try { return await getWcaProfile(account.wcaId); } catch (error) { return wcaError(error); }
  }),
  setId: cfopAccountProcedure.input(wcaIdInput).mutation(async ({ ctx, input }) => {
    if (!input.wcaId) { await updateCfopAccountWcaId(ctx.cfopAccount.id, null); return findCfopAccountPublicById(ctx.cfopAccount.id); }
    try {
      const profile = await getWcaProfile(normalizeWcaId(input.wcaId));
      await updateCfopAccountWcaId(ctx.cfopAccount.id, profile.wcaId);
      return findCfopAccountPublicById(ctx.cfopAccount.id);
    } catch (error) { return wcaError(error); }
  }),
  oauthStatus: cfopAccountProcedure.query(() => ({ configured: wcaOAuthConfigured() })),
  startOAuth: cfopAccountProcedure.mutation(async ({ ctx }) => {
    try { return { url: await beginWcaOAuth(ctx.cfopAccount.id) }; } catch (error) { return wcaError(error); }
  }),
  unlink: cfopAccountProcedure.mutation(async ({ ctx }) => { await updateCfopAccountWcaId(ctx.cfopAccount.id, null); return findCfopAccountPublicById(ctx.cfopAccount.id); }),
});

export const wcaRouter = router({
  countries: publicProcedure.query(async () => {
    try { return await getWcaCountries(); } catch (error) { return wcaError(error); }
  }),
  competitions: publicProcedure.input(wcaCalendarInput).query(async ({ input }) => {
    if (input.end < input.start) throw new TRPCError({ code: "BAD_REQUEST", message: "Ngày kết thúc phải sau ngày bắt đầu." });
    try { return await getWcaCompetitions(input); } catch (error) { return wcaError(error); }
  }),
});
