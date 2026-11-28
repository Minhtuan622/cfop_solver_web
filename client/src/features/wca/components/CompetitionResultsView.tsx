import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Select } from "@/components/ui/Select";
import { SkeletonList, StatusFeedback } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { errorMessage } from "@/lib/apiError";
import { trpc } from "@/lib/trpc";
import { wcaEventName } from "@/lib/wcaEvents";
import { cn } from "@/lib/utils";
import { flagEmoji } from "../lib/wcaCalendar";
import { formatAttempt, formatResultCell } from "../lib/myCompetitions";
import { isPodiumRound, podiumRows, type ResultRound, type ResultRow } from "../lib/explore";

const MEDAL_TONE = ["bg-warning-soft text-ink", "bg-surface-3 text-ink", "bg-primary-soft text-ink"];

function Person({ row }: { row: Pick<ResultRow, "name" | "wcaId"> }) {
  if (!row.wcaId) return <>{row.name}</>;
  return (
    <Link href={`/wca/persons/${row.wcaId}`} className="text-ink hover:text-primary hover:underline">
      {row.name}
    </Link>
  );
}

function RecordTag({ value }: { value: string | null }) {
  if (!value) return null;
  return <span className="ml-1 rounded-full bg-danger-soft px-1.5 py-0.5 text-[10px] font-bold text-danger">{value}</span>;
}

function Podium({ eventId, round }: { eventId: string; round: ResultRound }) {
  const { t } = useLanguage();
  const rows = podiumRows(round);
  if (rows.length === 0) return null;
  const useAverage = round.rows.some(row => (row.average ?? 0) > 0);
  return (
    <ol className="m-0 mb-4 grid list-none gap-2 p-0 sm:grid-cols-3">
      {rows.map(row => (
        <li key={`${row.pos}-${row.name}`} className={cn("rounded-panel px-4 py-3", MEDAL_TONE[(row.pos ?? 1) - 1])}>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted">
            {t(`wcax.medal.${row.pos}`)}
          </p>
          <p className="m-0 mt-0.5 text-sm font-semibold">
            <Person row={row} /> {flagEmoji(row.countryIso2)}
          </p>
          <p className="m-0 mt-1 text-lg font-bold tabular-nums">
            {useAverage && (row.average ?? 0) > 0
              ? formatResultCell(eventId, "average", row.average as number)
              : formatResultCell(eventId, "single", row.best as number)}
            <RecordTag value={useAverage ? row.averageRecord : row.singleRecord} />
          </p>
          <p className="m-0 text-xs text-muted">
            {t("wcax.bestSingle", { value: formatResultCell(eventId, "single", row.best ?? 0) })}
          </p>
        </li>
      ))}
    </ol>
  );
}

function RoundTable({ eventId, round }: { eventId: string; round: ResultRound }) {
  const { t } = useLanguage();
  const attemptCount = Math.max(0, ...round.rows.map(row => row.attempts.length));
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs text-muted">
            <th scope="col" className="py-1 pr-3 font-semibold">#</th>
            <th scope="col" className="py-1 pr-3 font-semibold">{t("wcax.col.name")}</th>
            <th scope="col" className="py-1 pr-3 font-semibold">{t("wcax.col.best")}</th>
            <th scope="col" className="py-1 pr-3 font-semibold">{t("wcax.col.average")}</th>
            {attemptCount > 0 ? <th scope="col" className="py-1 font-semibold">{t("wcax.col.attempts")}</th> : null}
          </tr>
        </thead>
        <tbody>
          {round.rows.map((row, index) => (
            <tr key={`${row.pos}-${row.name}-${index}`} className="odd:bg-surface-2/60">
              <td className="py-1 pr-3 tabular-nums text-muted">{row.pos ?? "—"}</td>
              <td className="py-1 pr-3">
                <Person row={row} /> <span className="text-xs text-muted">{flagEmoji(row.countryIso2)}</span>
              </td>
              <td className="py-1 pr-3 tabular-nums">
                {formatResultCell(eventId, "single", row.best ?? 0)}
                <RecordTag value={row.singleRecord} />
              </td>
              <td className="py-1 pr-3 tabular-nums">
                {(row.average ?? 0) !== 0 ? formatResultCell(eventId, "average", row.average as number) : "—"}
                <RecordTag value={row.averageRecord} />
              </td>
              {attemptCount > 0 ? (
                <td className="py-1 text-xs tabular-nums text-muted">
                  {row.attempts.map(value => formatAttempt(eventId, value)).join("  ")}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CompetitionResultsView({ competitionId }: { competitionId: string }) {
  const { language, t } = useLanguage();
  const query = trpc.wca.competitionResults.useQuery({ id: competitionId }, { staleTime: 10 * 60 * 1000, retry: false });
  const events = query.data?.events ?? [];
  const [eventId, setEventId] = useState("");
  useEffect(() => {
    if (!eventId && events[0]) setEventId(events[0].eventId);
  }, [eventId, events]);

  if (query.isLoading) return <SkeletonList rows={4} label={t("wcax.loading")} />;
  if (query.isError)
    return (
      <StatusFeedback tone="danger" title={t("wcax.failed")}>
        {errorMessage(query.error, t)}
      </StatusFeedback>
    );
  if (events.length === 0) return <p className="m-0 text-sm text-muted">{t("wcax.results.empty")}</p>;
  const current = events.find(event => event.eventId === eventId) ?? events[0];
  const rounds = [...current.rounds].reverse();
  return (
    <div className="flex flex-col gap-4">
      <Select
        value={current.eventId}
        onChange={event => setEventId(event.target.value)}
        aria-label={t("wcax.event")}
        className="w-full sm:w-64"
      >
        {events.map(event => (
          <option key={event.eventId} value={event.eventId}>
            {wcaEventName(event.eventId, language)}
          </option>
        ))}
      </Select>
      {rounds.map(round => (
        <section key={round.roundTypeId}>
          <h5 className="mb-2 mt-0 text-xs font-semibold uppercase tracking-wide text-muted">
            {t(`wca.mine.round.${round.roundTypeId}`)} · {t("wcax.rows", { count: round.rows.length })}
          </h5>
          {isPodiumRound(round) ? <Podium eventId={current.eventId} round={round} /> : null}
          <RoundTable eventId={current.eventId} round={round} />
        </section>
      ))}
    </div>
  );
}
