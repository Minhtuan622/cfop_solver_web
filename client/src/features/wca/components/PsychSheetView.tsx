import { useState } from "react";
import { Link } from "wouter";
import { Select } from "@/components/ui/Select";
import { SkeletonList, StatusFeedback } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { errorMessage } from "@/lib/apiError";
import { trpc } from "@/lib/trpc";
import { wcaEventName } from "@/lib/wcaEvents";
import { flagEmoji } from "../lib/wcaCalendar";
import { formatWcaRecordValue } from "../lib/wcaRecords";

function Rank({ rank }: { rank: number | null }) {
  return rank ? <span className="ml-1 text-xs text-muted">#{rank.toLocaleString("en-US")}</span> : null;
}

export function PsychSheetView({
  competitionId,
  eventIds,
  highlightWcaId,
}: {
  competitionId: string;
  eventIds: readonly string[];
  highlightWcaId?: string | null;
}) {
  const { language, t } = useLanguage();
  const [eventId, setEventId] = useState(eventIds[0] ?? "");
  const query = trpc.wca.psychSheet.useQuery(
    { id: competitionId, eventId },
    { enabled: Boolean(eventId), staleTime: 10 * 60 * 1000, retry: false }
  );
  if (eventIds.length === 0) return <p className="m-0 text-sm text-muted">{t("wcax.psych.empty")}</p>;
  const rows = query.data?.rows ?? [];
  return (
    <div className="flex flex-col gap-3">
      <Select
        value={eventId}
        onChange={event => setEventId(event.target.value)}
        aria-label={t("wcax.event")}
        className="w-full sm:w-64"
      >
        {eventIds.map(id => (
          <option key={id} value={id}>
            {wcaEventName(id, language)}
          </option>
        ))}
      </Select>
      {query.isLoading ? <SkeletonList rows={4} label={t("wcax.loading")} /> : null}
      {query.isError ? (
        <StatusFeedback tone="danger" title={t("wcax.failed")}>
          {errorMessage(query.error, t)}
        </StatusFeedback>
      ) : null}
      {query.data && rows.length === 0 ? <p className="m-0 text-sm text-muted">{t("wcax.psych.empty")}</p> : null}
      {rows.length > 0 ? (
        <>
          <p className="m-0 text-xs text-muted">
            {t(query.data?.sortBy === "single" ? "wcax.psych.sortSingle" : "wcax.psych.sortAverage", { count: rows.length })}
          </p>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-muted">
                  <th scope="col" className="py-1 pr-3 font-semibold">#</th>
                  <th scope="col" className="py-1 pr-3 font-semibold">{t("wcax.col.name")}</th>
                  <th scope="col" className="py-1 pr-3 font-semibold">{t("wcax.col.average")}</th>
                  <th scope="col" className="py-1 font-semibold">{t("wcax.col.best")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr
                    key={`${row.pos}-${row.name}`}
                    className={row.wcaId && row.wcaId === highlightWcaId ? "bg-primary-soft" : "odd:bg-surface-2/60"}
                  >
                    <td className="py-1 pr-3 tabular-nums text-muted">{row.pos}</td>
                    <td className="py-1 pr-3">
                      {row.wcaId ? (
                        <Link href={`/wca/persons/${row.wcaId}`} className="text-ink hover:text-primary hover:underline">
                          {row.name}
                        </Link>
                      ) : (
                        row.name
                      )}{" "}
                      <span className="text-xs text-muted">{flagEmoji(row.countryIso2)}</span>
                    </td>
                    <td className="py-1 pr-3 tabular-nums">
                      {formatWcaRecordValue(eventId, "average", row.average.best)}
                      <Rank rank={row.average.rank} />
                    </td>
                    <td className="py-1 tabular-nums">
                      {formatWcaRecordValue(eventId, "single", row.single.best)}
                      <Rank rank={row.single.rank} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
