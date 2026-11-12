import { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  CompetitionLeaderboardFilters,
  type CompetitionPeriod,
} from "@/features/competition";
import {
  LoadingTransition,
  PageHeader,
  RefreshIndicator,
  SectionCard,
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  StatTile,
  StatusFeedback,
} from "@/components/ui/StudioUI";
import {
  competitionEventLabel,
  competitionResultLabel,
  formatLabels,
} from "@/features/competition";
import { formatSolveTime } from "@/lib/solveHistory";
import { trpc } from "@/lib/trpc";
import { type TimerEventId } from "@/lib/timerEvents";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import type { Translate } from "@/lib/i18n";
import { PersonCircle } from "@/components/ui/Icon";

function formatDate(value: Date | string, language: Language) {
  return new Date(value).toLocaleString(language === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function playerScoreLabel(
  score: number | null | undefined,
  eventId: string,
  t: Translate
) {
  if (eventId === "333mbf")
    return typeof score === "number"
      ? t("competition.points", { points: score })
      : "DNF";
  return typeof score === "number" ? formatSolveTime(score) : "DNF";
}

function rankClass(rank: number) {
  if (rank === 1) return "text-bg-warning";
  if (rank === 2) return "text-bg-secondary";
  if (rank === 3) return "text-bg-secondary";
  return "text-bg-primary";
}

function LeaderboardTable({
  players,
}: {
  players: Array<{
    accountId: number;
    displayName: string;
    avatarUrl: string | null;
    points: number;
    wins: number;
    rooms: number;
    rank: number;
  }>;
}) {
  const { t } = useLanguage();
  return (
    <LoadingTransition>
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm [&_th]:px-3 [&_th]:py-2.5 [&_th]:align-middle [&_th]:font-semibold [&_th]:text-muted [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-middle [&_tbody_tr:hover]:bg-surface-2 align-middle mb-0">
          <caption className="sr-only">
            {t("competition.table.caption")}
          </caption>
          <thead>
            <tr>
              <th scope="col">{t("competition.table.rank")}</th>
              <th scope="col">{t("competition.table.player")}</th>
              <th scope="col" className="text-center">
                {t("competition.table.wins")}
              </th>
              <th scope="col" className="text-center">
                {t("competition.table.rooms")}
              </th>
              <th scope="col" className="text-right">
                {t("competition.table.points")}
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map(player => (
              <tr key={player.accountId}>
                <th scope="row">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide ${rankClass(player.rank)}`}
                  >
                    {player.rank}
                  </span>
                </th>
                <td>
                  <Link
                    href={`/competition/player/${player.accountId}`}
                    className="inline-flex items-center gap-2 no-underline"
                  >
                    <span
                      className="rounded-full bg-surface-2 inline-flex items-center justify-center shrink-0"
                      style={{ width: 32, height: 32 }}
                    >
                      {player.avatarUrl ? (
                        <img
                          src={player.avatarUrl}
                          alt=""
                          className="rounded-full w-full h-full object-cover"
                        />
                      ) : (
                        <PersonCircle className="text-muted" />
                      )}
                    </span>
                    <span className="text-ink font-semibold">
                      {player.displayName}
                    </span>
                  </Link>
                </td>
                <td className="text-center">{player.wins}</td>
                <td className="text-center">{player.rooms}</td>
                <td className="text-right">
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-primary text-white px-4">
                    {player.points}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LoadingTransition>
  );
}

function PlayerHistory({ accountId }: { accountId: number }) {
  const { language, t } = useLanguage();
  const historyQuery = trpc.competition.playerHistory.useQuery(
    { accountId },
    { retry: false }
  );
  if (historyQuery.isLoading)
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SkeletonCard lines={6} label={t("competition.player.loading")} />
      </div>
    );
  if (historyQuery.isError)
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <StatusFeedback
          tone="danger"
          title={t("competition.player.failedTitle")}
        >
          {t("competition.player.failedDetail")}
        </StatusFeedback>
      </div>
    );
  const history = historyQuery.data ?? [];
  const displayName =
    history[0]?.standings.find(player => player.accountId === accountId)
      ?.displayName ?? t("competition.player.anonymous", { id: accountId });
  const bestRank = history.reduce<number | null>(
    (best, entry) =>
      entry.myRank && (best === null || entry.myRank < best)
        ? entry.myRank
        : best,
    null
  );
  const totalRounds = history.reduce(
    (total, entry) =>
      total +
      entry.results.filter(result => result.accountId === accountId).length,
    0
  );
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <PageHeader
        title={t("competition.player.title", { name: displayName })}
        description={t("competition.player.description")}
        actions={
          <Link
            href="/competition"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2"
          >
            {t("competition.player.back")}
          </Link>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <StatTile
            label={t("competition.player.statRooms")}
            value={history.length}
          />
        </div>
        <div>
          <StatTile
            label={t("competition.player.statRank")}
            value={bestRank === null ? "—" : `#${bestRank}`}
          />
        </div>
        <div>
          <StatTile
            label={t("competition.player.statRounds")}
            value={totalRounds}
          />
        </div>
      </div>
      {history.length === 0 ? (
        <StatusFeedback
          tone="secondary"
          title={t("competition.player.emptyTitle")}
        >
          {t("competition.player.emptyDetail")}
        </StatusFeedback>
      ) : (
        <div className="flex flex-col gap-6">
          {history.map(entry => {
            const mine = entry.results.filter(
              result => result.accountId === accountId
            );
            return (
              <SectionCard
                key={entry.room.id}
                title={entry.room.name}
                description={t("competition.player.roomMeta", {
                  event: competitionEventLabel(entry.room.eventId, language),
                  format: formatLabels[entry.room.format],
                  date: formatDate(entry.room.updatedAt, language),
                })}
                actions={
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-3 text-ink">
                    {entry.myRank
                      ? t("competition.player.rankSuffix", {
                          rank: entry.myRank,
                          total: entry.standings.length,
                        })
                      : t("competition.player.unranked")}
                  </span>
                }
              >
                <div className="grid grid-cols-12 gap-4 mb-6">
                  <div className="col-span-6 lg:col-span-3">
                    <p className="text-sm text-muted mb-1">
                      {t("competition.player.roomCode")}
                    </p>
                    <p className="mb-0 font-semibold">{entry.room.code}</p>
                  </div>
                  <div className="col-span-6 lg:col-span-3">
                    <p className="text-sm text-muted mb-1">
                      {t("competition.player.totalScore")}
                    </p>
                    <p className="mb-0 font-semibold">
                      {playerScoreLabel(entry.myScore, entry.room.eventId, t)}
                    </p>
                  </div>
                  <div className="col-span-6 lg:col-span-3">
                    <p className="text-sm text-muted mb-1">
                      {t("competition.player.roundCount")}
                    </p>
                    <p className="mb-0 font-semibold">
                      {mine.length}/{entry.roundLimit}
                    </p>
                  </div>
                  <div className="col-span-6 lg:col-span-3">
                    <p className="text-sm text-muted mb-1">
                      {t("competition.player.joined")}
                    </p>
                    <p className="mb-0 font-semibold">
                      {formatDate(entry.joinedAt, language)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 xl:col-span-7">
                    <h3 className="text-sm font-semibold tracking-tight">
                      {t("competition.player.roundTitle")}
                    </h3>
                    {mine.length ? (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm [&_th]:px-3 [&_th]:py-2.5 [&_th]:align-middle [&_th]:font-semibold [&_th]:text-muted [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-middle [&_th]:py-1.5 [&_td]:py-1.5 [&_tbody_tr:hover]:bg-surface-2 align-middle">
                          <thead>
                            <tr>
                              <th scope="col">
                                {t("competition.player.round")}
                              </th>
                              <th scope="col">
                                {t("competition.player.result")}
                              </th>
                              <th scope="col">
                                {t("competition.player.inspection")}
                              </th>
                              <th scope="col">
                                {t("competition.player.submitted")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {mine.map(result => (
                              <tr key={`${result.roundId}-${result.accountId}`}>
                                <th scope="row">{result.roundSequence}</th>
                                <td>
                                  {competitionResultLabel(
                                    result,
                                    entry.room.eventId,
                                    t
                                  )}
                                </td>
                                <td>
                                  {result.inspectionMs
                                    ? t("competition.player.inspectionTime", {
                                        seconds: (
                                          result.inspectionMs / 1000
                                        ).toFixed(1),
                                      })
                                    : "—"}
                                </td>
                                <td>
                                  {formatDate(result.submittedAt, language)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted">
                        {t("competition.player.noResults")}
                      </p>
                    )}
                  </div>
                  <div className="col-span-12 xl:col-span-5">
                    <h3 className="text-sm font-semibold tracking-tight">
                      {t("competition.player.roomStandings")}
                    </h3>
                    <ol className="divide-y divide-line overflow-hidden rounded-panel border border-line bg-surface list-decimal pl-6">
                      {entry.standings.map(player => (
                        <li
                          key={player.accountId}
                          className="block px-4 py-3 text-sm flex justify-between gap-2"
                        >
                          <span className="truncate">{player.displayName}</span>
                          <span className="whitespace-nowrap">
                            {competitionResultLabel(
                              player.lastResult,
                              entry.room.eventId,
                              t
                            )}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LeaderboardHome() {
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
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover"
          >
            {t("competition.leaderboard.cta")}
          </Link>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
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
          <div className="flex flex-wrap items-center justify-between gap-2">
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
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs"
            >
              {t("competition.leaderboard.viewRooms")}
            </Link>
          </div>
        </div>
        <div className="col-span-12 xl:col-span-4">
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
              <div className="divide-y divide-line overflow-hidden rounded-panel border border-line bg-surface">
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
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs mt-4"
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

export default function CompetitionLeaderboard() {
  const [, params] = useRoute("/competition/player/:accountId");
  const playerId = params?.accountId ? Number(params.accountId) : null;
  return playerId !== null && Number.isInteger(playerId) && playerId > 0 ? (
    <PlayerHistory accountId={playerId} />
  ) : (
    <LeaderboardHome />
  );
}
