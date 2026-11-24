import { useRoute } from "wouter";
import { LeaderboardHome } from "@/features/competition/components/LeaderboardHome";
import { PlayerHistory } from "@/features/competition/components/PlayerHistory";

export default function CompetitionLeaderboard() {
  const [, params] = useRoute("/competition/player/:accountId");
  const playerId = params?.accountId ? Number(params.accountId) : null;
  return playerId !== null && Number.isInteger(playerId) && playerId > 0 ? (
    <PlayerHistory accountId={playerId} />
  ) : (
    <LeaderboardHome />
  );
}
