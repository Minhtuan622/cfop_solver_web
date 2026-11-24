import { router } from "../_core/trpc";
import { moderationProcedures } from "./competitionModeration";
import { roomProcedures } from "./competitionRooms";
import { roundProcedures } from "./competitionRounds";
import { statsProcedures } from "./competitionStats";

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

export const competitionRouter = router({
  ...statsProcedures,
  ...roomProcedures,
  ...moderationProcedures,
  ...roundProcedures,
});
