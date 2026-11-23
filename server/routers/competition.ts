import { router } from "../_core/trpc";
import { moderationProcedures } from "./competitionModeration";
import { roomProcedures } from "./competitionRooms";
import { roundProcedures } from "./competitionRounds";
import { statsProcedures } from "./competitionStats";

// Các export dưới đây giữ nguyên tên cũ của module này (test và nơi khác import).
export {
  chatLimiter,
  leaderboardCache,
  MAX_SPECTATORS_PER_ROOM,
  LATEST_MESSAGES_LIMIT,
  playerHistoryLimiter,
  roomCreateLimiter,
} from "./competitionState";
export {
  playerHistoryCache,
  playerHistoryQuery,
  type PlayerHistoryEntry,
} from "./competitionStats";

/**
 * Router thi đấu: 18 procedure chia theo nhóm — thống kê (bảng xếp hạng, lịch
 * sử), phòng (tạo, vào, rời, xoá, đấu lại), quản trị (moderator, loại khán
 * giả) và lượt thi (bắt đầu, nộp kết quả, chat).
 */
export const competitionRouter = router({
  ...statsProcedures,
  ...roomProcedures,
  ...moderationProcedures,
  ...roundProcedures,
});
