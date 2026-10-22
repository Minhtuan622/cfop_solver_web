import { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { CompetitionLeaderboardFilters, type CompetitionPeriod } from "@/features/competition";
import { LoadingTransition, PageHeader, RefreshIndicator, SectionCard, SkeletonCard, SkeletonList, SkeletonTable, StatTile, StatusFeedback } from "@/components/ui/BootstrapUI";
import { competitionEventLabel, competitionResultLabel, formatLabels } from "@/features/competition";
import { formatSolveTime } from "@/lib/solveHistory";
import { trpc } from "@/lib/trpc";
import { type TimerEventId } from "@/lib/timerEvents";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import type { Translate } from "@/lib/i18n";

function formatDate(value: Date | string, language: Language) {
  return new Date(value).toLocaleString(language === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium", timeStyle: "short" });
}

function playerScoreLabel(score: number | null | undefined, eventId: string, t: Translate) {
  if (eventId === "333mbf") return typeof score === "number" ? t("competition.points", { points: score }) : "DNF";
  return typeof score === "number" ? formatSolveTime(score) : "DNF";
}

function rankClass(rank: number) {
  if (rank === 1) return "text-bg-warning";
  if (rank === 2) return "text-bg-secondary";
  if (rank === 3) return "text-bg-secondary";
  return "text-bg-primary";
}

function LeaderboardTable({ players }: { players: Array<{ accountId: number; displayName: string; avatarUrl: string | null; points: number; wins: number; rooms: number; rank: number }> }) {
  const { t } = useLanguage();
  return (
    <LoadingTransition>
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <caption className="visually-hidden">{t("competition.table.caption")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("competition.table.rank")}</th>
              <th scope="col">{t("competition.table.player")}</th>
              <th scope="col" className="text-center">{t("competition.table.wins")}</th>
              <th scope="col" className="text-center">{t("competition.table.rooms")}</th>
              <th scope="col" className="text-end">{t("competition.table.points")}</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.accountId}>
                <th scope="row"><span className={`badge rounded-pill ${rankClass(player.rank)}`}>{player.rank}</span></th>
                <td>
                  <Link href={`/competition/player/${player.accountId}`} className="d-inline-flex align-items-center gap-2 text-decoration-none">
                    <span className="rounded-circle bg-body-secondary d-inline-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 32, height: 32 }}>
                      {player.avatarUrl ? <img src={player.avatarUrl} alt="" className="rounded-circle w-100 h-100 object-fit-cover" /> : <i className="bi bi-person text-body-secondary" aria-hidden="true" />}
                    </span>
                    <span className="text-body fw-semibold">{player.displayName}</span>
                  </Link>
                </td>
                <td className="text-center">{player.wins}</td>
                <td className="text-center">{player.rooms}</td>
                <td className="text-end"><span className="badge rounded-pill text-bg-primary px-3">{player.points}</span></td>
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
  const historyQuery = trpc.competition.playerHistory.useQuery({ accountId }, { retry: false });
  if (historyQuery.isLoading) return <div className="container"><SkeletonCard lines={6} label={t("competition.player.loading")} /></div>;
  if (historyQuery.isError) return <div className="container"><StatusFeedback tone="danger" title={t("competition.player.failedTitle")}>{t("competition.player.failedDetail")}</StatusFeedback></div>;
  const history = historyQuery.data ?? [];
  const displayName = history[0]?.standings.find((player) => player.accountId === accountId)?.displayName ?? t("competition.player.anonymous", { id: accountId });
  const bestRank = history.reduce<number | null>((best, entry) => entry.myRank && (best === null || entry.myRank < best) ? entry.myRank : best, null);
  const totalRounds = history.reduce((total, entry) => total + entry.results.filter((result) => result.accountId === accountId).length, 0);
  return (
    <div className="container">
      <PageHeader
        title={t("competition.player.title", { name: displayName })}
        description={t("competition.player.description")}
        actions={<Link href="/competition" className="btn btn-outline-secondary">{t("competition.player.back")}</Link>}
      />
      <div className="row row-cols-1 row-cols-sm-3 g-3 mb-4">
        <div className="col"><StatTile label={t("competition.player.statRooms")} value={history.length} /></div>
        <div className="col"><StatTile label={t("competition.player.statRank")} value={bestRank === null ? "—" : `#${bestRank}`} /></div>
        <div className="col"><StatTile label={t("competition.player.statRounds")} value={totalRounds} /></div>
      </div>
      {history.length === 0
        ? <StatusFeedback tone="secondary" title={t("competition.player.emptyTitle")}>{t("competition.player.emptyDetail")}</StatusFeedback>
        : (
          <div className="d-flex flex-column gap-4">
            {history.map((entry) => {
              const mine = entry.results.filter((result) => result.accountId === accountId);
              return (
                <SectionCard
                  key={entry.room.id}
                  title={entry.room.name}
                  description={t("competition.player.roomMeta", {
                    event: competitionEventLabel(entry.room.eventId, language),
                    format: formatLabels[entry.room.format],
                    date: formatDate(entry.room.updatedAt, language),
                  })}
                  actions={<span className="badge text-bg-secondary">{entry.myRank ? t("competition.player.rankSuffix", { rank: entry.myRank, total: entry.standings.length }) : t("competition.player.unranked")}</span>}
                >
                  <div className="row g-3 mb-4">
                    <div className="col-6 col-lg-3"><p className="small text-body-secondary mb-1">{t("competition.player.roomCode")}</p><p className="mb-0 fw-semibold">{entry.room.code}</p></div>
                    <div className="col-6 col-lg-3"><p className="small text-body-secondary mb-1">{t("competition.player.totalScore")}</p><p className="mb-0 fw-semibold">{playerScoreLabel(entry.myScore, entry.room.eventId, t)}</p></div>
                    <div className="col-6 col-lg-3"><p className="small text-body-secondary mb-1">{t("competition.player.roundCount")}</p><p className="mb-0 fw-semibold">{mine.length}/{entry.roundLimit}</p></div>
                    <div className="col-6 col-lg-3"><p className="small text-body-secondary mb-1">{t("competition.player.joined")}</p><p className="mb-0 fw-semibold">{formatDate(entry.joinedAt, language)}</p></div>
                  </div>
                  <div className="row g-4">
                    <div className="col-12 col-xl-7">
                      <h3 className="h6">{t("competition.player.roundTitle")}</h3>
                      {mine.length ? (
                        <div className="table-responsive">
                          <table className="table table-sm table-hover align-middle">
                            <thead>
                              <tr>
                                <th scope="col">{t("competition.player.round")}</th>
                                <th scope="col">{t("competition.player.result")}</th>
                                <th scope="col">{t("competition.player.inspection")}</th>
                                <th scope="col">{t("competition.player.submitted")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mine.map((result) => (
                                <tr key={`${result.roundId}-${result.accountId}`}>
                                  <th scope="row">{result.roundSequence}</th>
                                  <td>{competitionResultLabel(result, entry.room.eventId, t)}</td>
                                  <td>{result.inspectionMs ? t("competition.player.inspectionTime", { seconds: (result.inspectionMs / 1000).toFixed(1) }) : "—"}</td>
                                  <td>{formatDate(result.submittedAt, language)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : <p className="text-body-secondary">{t("competition.player.noResults")}</p>}
                    </div>
                    <div className="col-12 col-xl-5">
                      <h3 className="h6">{t("competition.player.roomStandings")}</h3>
                      <ol className="list-group list-group-numbered">
                        {entry.standings.map((player) => (
                          <li key={player.accountId} className="list-group-item d-flex justify-content-between gap-2">
                            <span className="text-truncate">{player.displayName}</span>
                            <span className="text-nowrap">{competitionResultLabel(player.lastResult, entry.room.eventId, t)}</span>
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
  const input = useMemo(() => ({ period, eventId: eventId === "all" ? null : eventId }), [period, eventId]);
  const leaderboardQuery = trpc.competition.leaderboard.useQuery(input, { retry: false });
  const accountQuery = trpc.cfopAccount.me.useQuery(undefined, { retry: false, staleTime: 30_000 });
  const account = accountQuery.data;
  const historyQuery = trpc.competition.history.useQuery(undefined, { enabled: Boolean(account), retry: false });
  const players = leaderboardQuery.data?.players ?? [];
  const leader = players[0];
  const totalWins = players.reduce((total, player) => total + player.wins, 0);
  const totalRooms = players.reduce((total, player) => total + player.rooms, 0);
  return (
    <div className="container">
      <PageHeader
        title={t("competition.leaderboard.title")}
        description={t("competition.leaderboard.description")}
        actions={<Link href="/rooms" className="btn btn-primary">{t("competition.leaderboard.cta")}</Link>}
      />
      <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3 mb-4">
        <div className="col"><StatTile label={t("competition.stat.players")} value={leaderboardQuery.isLoading ? "—" : players.length} detail={t("competition.stat.playersDetail")} /></div>
        <div className="col"><StatTile label={t("competition.stat.wins")} value={leaderboardQuery.isLoading ? "—" : totalWins} detail={t("competition.stat.winsDetail")} /></div>
        <div className="col"><StatTile label={t("competition.stat.rooms")} value={leaderboardQuery.isLoading ? "—" : totalRooms} detail={t("competition.stat.roomsDetail")} /></div>
        <div className="col">
          <StatTile
            label={t("competition.stat.leader")}
            value={<span className="text-truncate d-block">{leader?.displayName ?? "—"}</span>}
            detail={leader ? t("competition.stat.leaderDetail", { points: leader.points }) : t("competition.emptyTitle")}
          />
        </div>
      </div>
      <div className="row g-4">
        <div className="col-12 col-xl-8">
          <SectionCard
            title={t("competition.section.title")}
            description={t("competition.section.description")}
            actions={<CompetitionLeaderboardFilters period={period} onPeriodChange={setPeriod} eventId={eventId} onEventChange={setEventId} idPrefix="page-leaderboard" />}
          >
            {leaderboardQuery.isFetching && leaderboardQuery.data
              ? <div className="mb-2 text-end"><RefreshIndicator label={t("competition.refreshing")} /></div>
              : null}
            {leaderboardQuery.isLoading
              ? <SkeletonTable rows={6} columns={5} label={t("competition.loading")} />
              : leaderboardQuery.isError
                ? <StatusFeedback tone="danger" title={t("competition.loadFailedTitle")}>{t("competition.loadFailedDetail")}</StatusFeedback>
                : players.length
                  ? <LeaderboardTable players={players} />
                  : <StatusFeedback tone="secondary" title={t("competition.emptyTitle")}>{t("competition.emptyDetail")}</StatusFeedback>}
          </SectionCard>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <p className="small text-body-secondary mb-0">
              {leaderboardQuery.data ? t("competition.period", { start: formatDate(leaderboardQuery.data.startAt, language), end: formatDate(leaderboardQuery.data.endAt, language) }) : ""}
            </p>
            <Link href="/rooms" className="btn btn-outline-secondary btn-sm">{t("competition.leaderboard.viewRooms")}</Link>
          </div>
        </div>
        <div className="col-12 col-xl-4">
          <SectionCard title={t("competition.myHistory.title")} description={t("competition.myHistory.description")}>
            {accountQuery.isLoading
              ? <SkeletonList rows={3} label={t("competition.myHistory.loading")} />
              : !account
                ? <StatusFeedback tone="secondary" title={t("competition.myHistory.signInTitle")}>{t("competition.myHistory.signInDetail")}</StatusFeedback>
                : historyQuery.isLoading
                  ? <SkeletonList rows={3} label={t("competition.myHistory.loading")} />
                  : historyQuery.isError
                    ? <StatusFeedback tone="danger" title={t("competition.myHistory.failedTitle")}>{t("competition.myHistory.failedDetail")}</StatusFeedback>
                    : historyQuery.data?.length
                      ? (
                        <div className="list-group">
                          {historyQuery.data.slice(0, 6).map((entry) => (
                            <Link key={entry.room.id} href={`/competition/player/${account.id}`} className="list-group-item list-group-item-action">
                              <span className="fw-semibold d-block text-truncate">{entry.room.name}</span>
                              <span className="small text-body-secondary">
                                {competitionEventLabel(entry.room.eventId, language)} · {entry.myRank ? t("competition.player.rankOnly", { rank: entry.myRank }) : t("competition.player.unranked")} · {formatDate(entry.room.updatedAt, language)}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )
                      : <StatusFeedback tone="secondary" title={t("competition.myHistory.emptyTitle")}>{t("competition.myHistory.emptyDetail")}</StatusFeedback>}
            {account ? <Link href={`/competition/player/${account.id}`} className="btn btn-outline-secondary btn-sm mt-3">{t("competition.myHistory.detail")}</Link> : null}
          </SectionCard>
          <SectionCard title={t("competition.scoring.title")} description={t("competition.scoring.description")}>
            <p className="small mb-2">{t("competition.scoring.intro")}</p>
            <p className="small text-body-secondary mb-0">{t("competition.scoring.table")}</p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export default function CompetitionLeaderboard() {
  const [, params] = useRoute("/competition/player/:accountId");
  const playerId = params?.accountId ? Number(params.accountId) : null;
  return playerId !== null && Number.isInteger(playerId) && playerId > 0 ? <PlayerHistory accountId={playerId} /> : <LeaderboardHome />;
}
