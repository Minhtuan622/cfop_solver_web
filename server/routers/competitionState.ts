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

/** Giới hạn tin nhắn chat: 10 tin/10 giây cho mỗi người dùng trong mỗi phòng. */
export const chatLimiter = new RateLimiter();
/** Giới hạn tạo phòng: 5 phòng/giờ cho mỗi người dùng. */
export const roomCreateLimiter = new RateLimiter();
/**
 * Giới hạn xem lịch sử người chơi: 30 lần/giờ cho mỗi địa chỉ client.
 *
 * Limiter riêng, không mượn `roomCreateLimiter`: hai hạn mức khác nhau về
 * mức độ và về vòng đời, dùng chung một bảng đếm sẽ làm hạn mức của bên
 * này bị bên kia ảnh hưởng.
 */
export const playerHistoryLimiter = new RateLimiter();
/** Tối đa số khán giả trong một phòng. */
export const MAX_SPECTATORS_PER_ROOM = 50;
/** Số tin nhắn mới nhất trả về trong competition.state. */
export const LATEST_MESSAGES_LIMIT = 50;

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;

/** Rate limit key cho tin nhắn chat của một người dùng trong một phòng. */
export function chatRateKey(accountId: number, roomId: number) {
  return `chat:${accountId}:${roomId}`;
}

/** Rate limit key cho tạo phòng của một người dùng. */
export function roomCreateRateKey(accountId: number) {
  return `room:create:${accountId}`;
}
