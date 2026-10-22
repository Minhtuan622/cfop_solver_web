import { useMemo, useState } from "react";
import { Link } from "wouter";
import { CompetitionLeaderboardFilters, type CompetitionPeriod } from "./CompetitionLeaderboardFilters";
import { LoadingTransition, RefreshIndicator, SkeletonList } from "@/components/ui/BootstrapUI";
import { trpc } from "@/lib/trpc";
import { type TimerEventId } from "@/lib/timerEvents";
import { useLanguage } from "@/contexts/LanguageContext";

export function SystemLeaderboard() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<CompetitionPeriod>("week");
  const [eventId, setEventId] = useState<TimerEventId | "all">("all");
  const input = useMemo(() => ({ period, eventId: eventId === "all" ? null : eventId }), [period, eventId]);
  const leaderboardQuery = trpc.competition.leaderboard.useQuery(input, { retry: false });
  return <section className="card mt-4"><div className="card-body"><div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><div><h2 className="h5 mb-1">{t("competition.section.title")}</h2><p className="text-body-secondary small mb-0">{t("competition.filter.hint")}</p></div><CompetitionLeaderboardFilters period={period} onPeriodChange={setPeriod} eventId={eventId} onEventChange={setEventId} idPrefix="rooms-leaderboard" /></div>{leaderboardQuery.isFetching && leaderboardQuery.data ? <div className="mb-2 text-end"><RefreshIndicator label={t("competition.filter.refreshing")} /></div> : null}{leaderboardQuery.isLoading ? <SkeletonList rows={3} label={t("competition.loading")} /> : leaderboardQuery.isError ? <div className="alert alert-danger mb-0" role="alert">{t("competition.filter.loadFailed")}</div> : leaderboardQuery.data?.players.length ? <LoadingTransition><ol className="list-group list-group-numbered">{leaderboardQuery.data.players.slice(0, 10).map((player) => <li key={player.accountId} className="list-group-item d-flex justify-content-between align-items-center gap-2"><Link href={`/competition/player/${player.accountId}`} className="text-truncate text-decoration-none"><strong>{player.displayName}</strong><small className="d-block text-body-secondary">{t("competition.filter.winsRooms", { wins: player.wins, rooms: player.rooms })}</small></Link><span className="badge text-bg-primary rounded-pill">{t("competition.filter.points", { points: player.points })}</span></li>)}</ol></LoadingTransition> : <p className="text-body-secondary mb-0">{t("competition.filter.emptyDetail")}</p>}<div className="mt-3"><Link href="/competition" className="btn btn-outline-secondary btn-sm">{t("competition.filter.fullBoard")}</Link></div></div></section>;
}
