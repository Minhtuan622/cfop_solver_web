import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../_core/trpc";
import { clientAddress } from "../infrastructure/rateLimit";
import { proxyTrustEnabled } from "../_core/proxy";
import { TtlCache, cacheKey } from "../infrastructure/cache";
import { buildCompetitionLeaderboard, competitionRoundLimit } from "../services/competition";
import {
  listCompetitionResultsForRooms,
  listFinishedCompetitionRoomsForAccount,
  listFinishedCompetitionResultsBetween,
} from "../db";
import { leaderboardInput } from "./inputs";
import { leaderboardRange, standingsFromResults } from "./competitionShared";
import {
  leaderboardCache,
  playerHistoryLimiter,
  HOUR,
} from "./competitionState";

export const statsProcedures = {
  leaderboard: publicProcedure
    .input(leaderboardInput)
    .query(async ({ input }) => {
      const eventId = input.eventId ?? null;
      return leaderboardCache.getOrSet(
        cacheKey(["leaderboard", input.period, eventId]),
        async () => {
          const { startAt, endAt } = leaderboardRange(input.period);
          const results = await listFinishedCompetitionResultsBetween(
            startAt,
            endAt,
            eventId
          );
          return {
            period: input.period,
            eventId,
            startAt,
            endAt,
            players: buildCompetitionLeaderboard(results).slice(0, 50),
          };
        }
      );
    }),
  playerHistory: publicProcedure
    .input(z.object({ accountId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const address = clientAddress(
        ctx.req as {
          headers: Record<string, string | string[] | undefined>;
          socket?: { remoteAddress?: string };
        },
        proxyTrustEnabled()
      );
      const rateResult = playerHistoryLimiter.consume(
        `playerHistory:${address}`,
        { limit: 30, windowMs: HOUR }
      );
      if (!rateResult.allowed)
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Bạn tra lịch sử quá thường xuyên. Vui lòng thử lại sau.",
        });

      const cacheKey = `playerHistory:${input.accountId}`;
      return playerHistoryCache.getOrSet(cacheKey, () =>
        playerHistoryQuery(input)
      );
    }),
};

export type PlayerHistoryEntry = Awaited<
  ReturnType<typeof playerHistoryQuery>
>[number];

export const playerHistoryCache = new TtlCache<PlayerHistoryEntry[]>({
  ttlMs: 60_000,
  maxEntries: 256,
});

export async function playerHistoryQuery(input: { accountId: number }) {
  const rooms = await listFinishedCompetitionRoomsForAccount(input.accountId);
  const roomIds = rooms.map(({ room }) => room.id);
  const allResults = await listCompetitionResultsForRooms(roomIds);
  const resultsByRoom = new Map<number, (typeof allResults)[number][]>();
  for (const result of allResults) {
    const bucket = resultsByRoom.get(result.roomId) ?? [];
    bucket.push(result);
    resultsByRoom.set(result.roomId, bucket);
  }
  const history = await Promise.all(
    rooms.map(async ({ room, joinedAt }) => {
      const results = resultsByRoom.get(room.id) ?? [];
      const standings = standingsFromResults(
        room.format,
        room.eventId,
        results
      );
      const mine = standings.find(
        player => player.accountId === input.accountId
      );
      if (!mine) return null;
      return {
        room,
        joinedAt,
        roundLimit: competitionRoundLimit(room.format, room.eventId),
        standings,
        results,
        myRank: mine.rank,
        myScore: mine.score ?? undefined,
      };
    })
  );
  return history.filter((entry): entry is NonNullable<typeof entry> =>
    Boolean(entry)
  );
}
