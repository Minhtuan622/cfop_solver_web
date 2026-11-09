import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  CompetitionLeaderboardFilters,
  type CompetitionPeriod,
} from "./CompetitionLeaderboardFilters";
import {
  LoadingTransition,
  RefreshIndicator,
  SkeletonList,
} from "@/components/ui/StudioUI";
import { trpc } from "@/lib/trpc";
import { type TimerEventId } from "@/lib/timerEvents";
import { useLanguage } from "@/contexts/LanguageContext";

export function SystemLeaderboard() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<CompetitionPeriod>("week");
  const [eventId, setEventId] = useState<TimerEventId | "all">("all");
  const input = useMemo(
    () => ({ period, eventId: eventId === "all" ? null : eventId }),
    [period, eventId]
  );
  const leaderboardQuery = trpc.competition.leaderboard.useQuery(input, {
    retry: false,
  });
  return (
    <section className="rounded-card border border-line/80 bg-surface shadow-soft mt-6">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight mb-1">
              {t("competition.section.title")}
            </h2>
            <p className="text-muted text-sm mb-0">
              {t("competition.filter.hint")}
            </p>
          </div>
          <CompetitionLeaderboardFilters
            period={period}
            onPeriodChange={setPeriod}
            eventId={eventId}
            onEventChange={setEventId}
            idPrefix="rooms-leaderboard"
          />
        </div>
        {leaderboardQuery.isFetching && leaderboardQuery.data ? (
          <div className="mb-2 text-right">
            <RefreshIndicator label={t("competition.filter.refreshing")} />
          </div>
        ) : null}
        {leaderboardQuery.isLoading ? (
          <SkeletonList rows={3} label={t("competition.loading")} />
        ) : leaderboardQuery.isError ? (
          <div
            className="rounded-panel border px-4 py-3 text-sm border-danger/20 bg-danger-soft text-ink mb-0"
            role="alert"
          >
            {t("competition.filter.loadFailed")}
          </div>
        ) : leaderboardQuery.data?.players.length ? (
          <LoadingTransition>
            <ol className="divide-y divide-line overflow-hidden rounded-panel border border-line bg-surface list-decimal pl-6">
              {leaderboardQuery.data.players.slice(0, 10).map(player => (
                <li
                  key={player.accountId}
                  className="block px-4 py-3 text-sm flex justify-between items-center gap-2"
                >
                  <Link
                    href={`/competition/player/${player.accountId}`}
                    className="truncate no-underline"
                  >
                    <strong>{player.displayName}</strong>
                    <small className="block text-muted">
                      {t("competition.filter.winsRooms", {
                        wins: player.wins,
                        rooms: player.rooms,
                      })}
                    </small>
                  </Link>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-primary text-white">
                    {t("competition.filter.points", { points: player.points })}
                  </span>
                </li>
              ))}
            </ol>
          </LoadingTransition>
        ) : (
          <p className="text-muted mb-0">
            {t("competition.filter.emptyDetail")}
          </p>
        )}
        <div className="mt-4">
          <Link
            href="/competition"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs"
          >
            {t("competition.filter.fullBoard")}
          </Link>
        </div>
      </div>
    </section>
  );
}
