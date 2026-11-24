import { Link } from "wouter";
import {
  PageHeader,
  SectionCard,
  SkeletonCard,
  StatTile,
  StatusFeedback,
} from "@/components/ui/StudioUI";
import { buttonClass } from "@/components/ui/Button";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  competitionEventLabel,
  competitionResultLabel,
  formatLabels,
} from "../lib/competitionPresentation";
import { formatDate, playerScoreLabel } from "../lib/leaderboardFormat";

export function PlayerHistory({ accountId }: { accountId: number }) {
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
            className={`${buttonClass("secondary", "md")}`}
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
                    <h3 className="mb-2 text-sm font-semibold tracking-tight">
                      {t("competition.player.roundTitle")}
                    </h3>
                    {mine.length ? (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left text-sm [&_th]:px-3 [&_th]:py-2.5 [&_th]:align-middle [&_th]:font-semibold [&_th]:text-muted [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-middle [&_th]:py-1.5 [&_td]:py-1.5 [&_tbody_tr:hover]:bg-surface-2 align-middle">
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
                    <h3 className="mb-2 text-sm font-semibold tracking-tight">
                      {t("competition.player.roomStandings")}
                    </h3>
                    <ol className="overflow-hidden rounded-panel bg-surface list-decimal pl-6">
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
