import { TRPCError } from "@trpc/server";
import { cfopAccountProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getWcaCommunity,
  getWcaCompetitionDetail,
  getWcaCompetitionInfo,
  getWcaCompetitionResults,
  getWcaCompetitionSchedule,
  getWcaNearbyCompetitions,
  getWcaPsychSheet,
  getWcaScrambleProgram,
  searchWca,
  getWcaCompetitions,
  getWcaMyCompetitions,
  getWcaCountries,
  getWcaProfile,
  getWcaRecentRecords,
  getWcaRecords,
  normalizeWcaId,
  WcaApiError,
} from "../services/wcaApi";
import {
  beginWcaOAuth,
  wcaOAuthConfigured,
  WcaOAuthError,
} from "../services/wcaOAuth";
import {
  findCfopAccountPublicById,
  findCfopAccountWcaById,
  updateCfopAccountWcaId,
} from "../db";
import { clientAddress } from "../infrastructure/rateLimit";
import { proxyTrustEnabled } from "../_core/proxy";
import {
  wcaCalendarInput,
  wcaCompetitionIdInput,
  wcaIdInput,
  wcaNearbyInput,
  wcaPersonInput,
  wcaPsychSheetInput,
  wcaSearchInput,
} from "./inputs";

export function wcaError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  if (error instanceof WcaApiError)
    throw new TRPCError({
      code:
        error.kind === "NOT_FOUND"
          ? "NOT_FOUND"
          : error.kind === "RATE_LIMITED"
            ? "TOO_MANY_REQUESTS"
            : "SERVICE_UNAVAILABLE",
      message: error.message,
    });
  if (error instanceof WcaOAuthError)
    throw new TRPCError({
      code:
        error.code === "NOT_CONFIGURED" ? "PRECONDITION_FAILED" : "BAD_REQUEST",
      message: error.message,
    });
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Không thể xử lý dữ liệu WCA.",
  });
}

function callerKey(req: {
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}) {
  return clientAddress(req, proxyTrustEnabled());
}

export const accountWcaRouter = router({
  profile: cfopAccountProcedure.query(async ({ ctx }) => {
    const account = await findCfopAccountWcaById(ctx.cfopAccount.id);
    if (!account?.wcaId) return null;
    try {
      return await getWcaProfile(account.wcaId, callerKey(ctx.req));
    } catch (error) {
      return wcaError(error);
    }
  }),
  myCompetitions: cfopAccountProcedure.query(async ({ ctx }) => {
    const account = await findCfopAccountWcaById(ctx.cfopAccount.id);
    if (!account?.wcaId) return null;
    try {
      return await getWcaMyCompetitions(account.wcaId, callerKey(ctx.req));
    } catch (error) {
      return wcaError(error);
    }
  }),
  competitionDetail: cfopAccountProcedure
    .input(wcaCompetitionIdInput)
    .query(async ({ ctx, input }) => {
      const account = await findCfopAccountWcaById(ctx.cfopAccount.id);
      if (!account?.wcaId)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Hãy liên kết WCA ID trước.",
        });
      try {
        return await getWcaCompetitionDetail(account.wcaId, input.id, callerKey(ctx.req));
      } catch (error) {
        return wcaError(error);
      }
    }),
  competitionAgenda: cfopAccountProcedure
    .input(wcaCompetitionIdInput)
    .query(async ({ ctx, input }) => {
      const account = await findCfopAccountWcaById(ctx.cfopAccount.id);
      if (!account?.wcaId)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Hãy liên kết WCA ID trước.",
        });
      try {
        return await getWcaCompetitionSchedule(input.id, account.wcaId, callerKey(ctx.req));
      } catch (error) {
        return wcaError(error);
      }
    }),
  setId: cfopAccountProcedure
    .input(wcaIdInput)
    .mutation(async ({ ctx, input }) => {
      if (!input.wcaId) {
        await updateCfopAccountWcaId(ctx.cfopAccount.id, null);
        return findCfopAccountPublicById(ctx.cfopAccount.id);
      }
      try {
        const profile = await getWcaProfile(
          normalizeWcaId(input.wcaId),
          callerKey(ctx.req)
        );
        try {
          await updateCfopAccountWcaId(ctx.cfopAccount.id, profile.wcaId);
        } catch (error) {
          if (error instanceof Error && /duplicate/i.test(error.message)) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Mã WCA này đã được liên kết với tài khoản khác.",
            });
          }
          throw error;
        }
        return findCfopAccountPublicById(ctx.cfopAccount.id);
      } catch (error) {
        return wcaError(error);
      }
    }),
  oauthStatus: cfopAccountProcedure.query(() => ({
    configured: wcaOAuthConfigured(),
  })),
  startOAuth: cfopAccountProcedure.mutation(async ({ ctx }) => {
    try {
      return { url: await beginWcaOAuth(ctx.cfopAccount.id) };
    } catch (error) {
      return wcaError(error);
    }
  }),
  unlink: cfopAccountProcedure.mutation(async ({ ctx }) => {
    await updateCfopAccountWcaId(ctx.cfopAccount.id, null);
    return findCfopAccountPublicById(ctx.cfopAccount.id);
  }),
});

export const wcaRouter = router({
  countries: publicProcedure.query(async ({ ctx }) => {
    try {
      return await getWcaCountries(callerKey(ctx.req));
    } catch (error) {
      return wcaError(error);
    }
  }),
  competitions: publicProcedure
    .input(wcaCalendarInput)
    .query(async ({ ctx, input }) => {
      if (input.end < input.start)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ngày kết thúc phải sau ngày bắt đầu.",
        });
      try {
        return await getWcaCompetitions(input, callerKey(ctx.req));
      } catch (error) {
        return wcaError(error);
      }
    }),
  records: publicProcedure.query(async ({ ctx }) => {
    try {
      return await getWcaRecords(callerKey(ctx.req));
    } catch (error) {
      return wcaError(error);
    }
  }),
  recentRecords: publicProcedure.query(async ({ ctx }) => {
    try {
      return await getWcaRecentRecords(callerKey(ctx.req));
    } catch (error) {
      return wcaError(error);
    }
  }),
  competitionInfo: publicProcedure
    .input(wcaCompetitionIdInput)
    .query(async ({ ctx, input }) => {
      try {
        return await getWcaCompetitionInfo(input.id, callerKey(ctx.req));
      } catch (error) {
        return wcaError(error);
      }
    }),
  competitionResults: publicProcedure
    .input(wcaCompetitionIdInput)
    .query(async ({ ctx, input }) => {
      try {
        return await getWcaCompetitionResults(input.id, callerKey(ctx.req));
      } catch (error) {
        return wcaError(error);
      }
    }),
  psychSheet: publicProcedure
    .input(wcaPsychSheetInput)
    .query(async ({ ctx, input }) => {
      try {
        return await getWcaPsychSheet(input.id, input.eventId, callerKey(ctx.req));
      } catch (error) {
        return wcaError(error);
      }
    }),
  competitionSchedule: publicProcedure
    .input(wcaCompetitionIdInput)
    .query(async ({ ctx, input }) => {
      try {
        return await getWcaCompetitionSchedule(input.id, null, callerKey(ctx.req));
      } catch (error) {
        return wcaError(error);
      }
    }),
  search: publicProcedure.input(wcaSearchInput).query(async ({ ctx, input }) => {
    try {
      return await searchWca(input.q, callerKey(ctx.req));
    } catch (error) {
      return wcaError(error);
    }
  }),
  person: publicProcedure.input(wcaPersonInput).query(async ({ ctx, input }) => {
    try {
      return await getWcaProfile(input.wcaId, callerKey(ctx.req));
    } catch (error) {
      return wcaError(error);
    }
  }),
  nearby: publicProcedure.input(wcaNearbyInput).query(async ({ ctx, input }) => {
    const origin =
      typeof input.latitude === "number" && typeof input.longitude === "number"
        ? { lat: input.latitude, lng: input.longitude }
        : null;
    try {
      return await getWcaNearbyCompetitions(
        { countryIso2: input.countryIso2, today: new Date().toISOString().slice(0, 10), origin },
        callerKey(ctx.req)
      );
    } catch (error) {
      return wcaError(error);
    }
  }),
  community: publicProcedure.query(async ({ ctx }) => {
    try {
      return await getWcaCommunity(callerKey(ctx.req));
    } catch (error) {
      return wcaError(error);
    }
  }),
  scrambleProgram: publicProcedure.query(async ({ ctx }) => {
    try {
      return await getWcaScrambleProgram(callerKey(ctx.req));
    } catch (error) {
      return wcaError(error);
    }
  }),
});
