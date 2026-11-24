import { RateLimiter } from "../infrastructure/rateLimit";
import { TtlCache } from "../infrastructure/cache";
import type { buildCompetitionLeaderboard } from "../services/competition";

type LeaderboardResponse = {
  period: "week" | "month";
  eventId: string | null;
  startAt: Date;
  endAt: Date;
  players: ReturnType<typeof buildCompetitionLeaderboard>;
};
export const leaderboardCache = new TtlCache<LeaderboardResponse>({
  ttlMs: 30_000,
  maxEntries: 64,
});

export const chatLimiter = new RateLimiter();
export const roomCreateLimiter = new RateLimiter();
export const playerHistoryLimiter = new RateLimiter();
export const MAX_SPECTATORS_PER_ROOM = 50;
export const LATEST_MESSAGES_LIMIT = 50;

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;

export function chatRateKey(accountId: number, roomId: number) {
  return `chat:${accountId}:${roomId}`;
}

export function roomCreateRateKey(accountId: number) {
  return `room:create:${accountId}`;
}
