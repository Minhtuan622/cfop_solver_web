import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  PageHeader,
  RefreshIndicator,
  SectionCard,
  SkeletonList,
  SkeletonTable,
  StatTile,
  StatusFeedback,
} from "@/components/ui/StudioUI";
import { buttonClass } from "@/components/ui/Button";
import { trpc } from "@/lib/trpc";
import { type TimerEventId } from "@/lib/timerEvents";
import { useLanguage } from "@/contexts/LanguageContext";
import { requestSignIn } from "@/lib/signInRequest";
import { competitionEventLabel } from "../lib/competitionPresentation";
import { formatDate } from "../lib/leaderboardFormat";
import {
  CompetitionLeaderboardFilters,
  type CompetitionPeriod,
} from "./CompetitionLeaderboardFilters";
import { LeaderboardTable } from "./LeaderboardTable";

export function LeaderboardHome() {
  const { language, t } = useLanguage();
  const [period, setPeriod] = useState<CompetitionPeriod>("week");
  const [eventId, setEventId] = useState<TimerEventId | "all">("all");
  const input = useMemo(
    () => ({ period, eventId: eventId === "all" ? null : eventId }),
    [period, eventId]
  );
  const leaderboardQuery = trpc.competition.leaderboard.useQuery(input, {
    retry: false,
  });
  const accountQuery = trpc.cfopAccount.me.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
  });
  const account = accountQuery.data;
  const historyQuery = trpc.competition.history.useQuery(undefined, {
    enabled: Boolean(account),
    retry: false,
  });
  const players = leaderboardQuery.data?.players ?? [];
  const leader = players[0];
  const totalWins = players.reduce((total, player) => total + player.wins, 0);
  const totalRooms = players.reduce((total, player) => total + player.rooms, 0);
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <PageHeader
        title={t("competition.leaderboard.title")}
        description={t("competition.leaderboard.description")}
        actions={
          <Link
            href="/rooms"
            className={`${buttonClass("primary", "md")}`}
          >
            {t("competition.leaderboard.cta")}
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 mb-6">
        <div>
          <StatTile
            label={t("competition.stat.players")}
            value={leaderboardQuery.isLoading ? "—" : players.length}
            detail={t("competition.stat.playersDetail")}
          />
        </div>
        <div>
          <StatTile
            label={t("competition.stat.wins")}
            value={leaderboardQuery.isLoading ? "—" : totalWins}
            detail={t("competition.stat.winsDetail")}
          />
        </div>
        <div>
          <StatTile
            label={t("competition.stat.rooms")}
            value={leaderboardQuery.isLoading ? "—" : totalRooms}
            detail={t("competition.stat.roomsDetail")}
          />
        </div>
        <div>
          <StatTile
            label={t("competition.stat.leader")}
            value={
              <span className="truncate block">
                {leader?.displayName ?? "—"}
              </span>
            }
            detail={
              leader
                ? t("competition.stat.leaderDetail", { points: leader.points })
                : t("competition.emptyTitle")
            }
          />
        </div>
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          <SectionCard
            title={t("competition.section.title")}
            description={t("competition.section.description")}
            actions={
              <CompetitionLeaderboardFilters
                period={period}
                onPeriodChange={setPeriod}
                eventId={eventId}
                onEventChange={setEventId}
                idPrefix="page-leaderboard"
              />
            }
          >
            {leaderboardQuery.isFetching && leaderboardQuery.data ? (
              <div className="mb-2 text-right">
                <RefreshIndicator label={t("competition.refreshing")} />
              </div>
            ) : null}
            {leaderboardQuery.isLoading ? (
              <SkeletonTable
                rows={6}
                columns={5}
                label={t("competition.loading")}
              />
            ) : leaderboardQuery.isError ? (
              <StatusFeedback
                tone="danger"
                title={t("competition.loadFailedTitle")}
              >
                {t("competition.loadFailedDetail")}
              </StatusFeedback>
            ) : players.length ? (
              <LeaderboardTable players={players} />
            ) : (
              <StatusFeedback
                tone="secondary"
                title={t("competition.emptyTitle")}
              >
                {t("competition.emptyDetail")}
              </StatusFeedback>
            )}
          </SectionCard>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted mb-0">
              {leaderboardQuery.data
                ? t("competition.period", {
                    start: formatDate(leaderboardQuery.data.startAt, language),
                    end: formatDate(leaderboardQuery.data.endAt, language),
                  })
                : ""}
            </p>
            <Link
              href="/rooms"
              className={`${buttonClass("secondary", "sm")}`}
            >
              {t("competition.leaderboard.viewRooms")}
            </Link>
          </div>
        </div>
        <div className="col-span-12 flex flex-col gap-6 xl:col-span-4">
          <SectionCard
            title={t("competition.myHistory.title")}
            description={t("competition.myHistory.description")}
          >
            {accountQuery.isLoading ? (
              <SkeletonList
                rows={3}
                label={t("competition.myHistory.loading")}
              />
            ) : !account ? (
              <StatusFeedback
                tone="secondary"
                title={t("competition.myHistory.signInTitle")}
                action={
                  <button
                    type="button"
                    onClick={requestSignIn}
                    className={buttonClass("primary", "sm")}
                  >
                    {t("account.signIn")}
                  </button>
                }
              >
                {t("competition.myHistory.signInDetail")}
              </StatusFeedback>
            ) : historyQuery.isLoading ? (
              <SkeletonList
                rows={3}
                label={t("competition.myHistory.loading")}
              />
            ) : historyQuery.isError ? (
              <StatusFeedback
                tone="danger"
                title={t("competition.myHistory.failedTitle")}
              >
                {t("competition.myHistory.failedDetail")}
              </StatusFeedback>
            ) : historyQuery.data?.length ? (
              <div className="overflow-hidden rounded-panel bg-surface">
                {historyQuery.data.slice(0, 6).map(entry => (
                  <Link
                    key={entry.room.id}
                    href={`/competition/player/${account.id}`}
                    className="block px-4 py-3 text-sm transition-colors hover:bg-surface-2"
                  >
                    <span className="font-semibold block truncate">
                      {entry.room.name}
                    </span>
                    <span className="text-sm text-muted">
                      {competitionEventLabel(entry.room.eventId, language)} ·{" "}
                      {entry.myRank
                        ? t("competition.player.rankOnly", {
                            rank: entry.myRank,
                          })
                        : t("competition.player.unranked")}{" "}
                      · {formatDate(entry.room.updatedAt, language)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <StatusFeedback
                tone="secondary"
                title={t("competition.myHistory.emptyTitle")}
              >
                {t("competition.myHistory.emptyDetail")}
              </StatusFeedback>
            )}
            {account ? (
              <Link
                href={`/competition/player/${account.id}`}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs mt-4"
              >
                {t("competition.myHistory.detail")}
              </Link>
            ) : null}
          </SectionCard>
          <SectionCard
            title={t("competition.scoring.title")}
            description={t("competition.scoring.description")}
          >
            <p className="text-sm mb-2">{t("competition.scoring.intro")}</p>
            <p className="text-sm text-muted mb-0">
              {t("competition.scoring.table")}
            </p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
