import { Link } from "wouter";
import { type TimerEventId } from "@/lib/timerEvents";
import { wcaRecordTargets, type WcaTimerComparisonRow } from "@/features/wca/lib/wcaTimerComparison";
import { trpc } from "@/lib/trpc";
import { formatSolveTime } from "@/lib/solveHistory";
import { useLanguage } from "@/contexts/LanguageContext";

import { buttonClass } from "@/components/ui/Button";

import type { Translate } from "../lib/timerLabTypes";

function wcaDeltaMessage(deltaMs: number | null, t: Translate) {
  if (deltaMs === null) return t("timer.wcaDeltaMissing");
  if (deltaMs === 0) return t("timer.wcaDeltaEqual");
  const difference = formatSolveTime(Math.abs(deltaMs));
  return deltaMs < 0
    ? t("timer.wcaTimerFaster", { value: difference })
    : t("timer.wcaOfficialFaster", { value: difference });
}

function RecordGap({ valueMs, gapMs }: { valueMs: number | null; gapMs: number | null }) {
  if (valueMs === null) return <span className="text-muted">—</span>;
  return (
    <span>
      {formatSolveTime(valueMs)}
      {gapMs !== null ? (
        <span className="ml-1 text-xs text-muted">
          ({gapMs > 0 ? "+" : "−"}
          {formatSolveTime(Math.abs(gapMs))})
        </span>
      ) : null}
    </span>
  );
}

export function EventWcaComparisonCard({
  eventId,
  eventLabel,
  rows,
  hasWcaId,
  loading,
  unavailable,
  hasRecord,
}: {
  eventId: TimerEventId;
  eventLabel: string;
  rows: WcaTimerComparisonRow[];
  hasWcaId: boolean;
  loading: boolean;
  unavailable: boolean;
  hasRecord: boolean;
}) {
  const { t } = useLanguage();
  const records = trpc.wca.records.useQuery(undefined, { staleTime: 60 * 60 * 1000, retry: 1 });
  const profile = trpc.cfopAccount.wca.profile.useQuery(undefined, {
    enabled: hasWcaId,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  const national = records.data?.countries.find(entry => entry.name === profile.data?.countryName)?.records ?? null;
  const targets = records.data ? wcaRecordTargets(rows, eventId, records.data.world, national) : [];
  const hasTargets = targets.some(target => target.worldMs !== null);
  return (
    <div className="rounded-card bg-surface">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold tracking-tight mb-1">
              {t("timer.wcaTitle", { event: eventLabel })}
            </h2>
            <p className="text-sm text-muted mb-0">{t("timer.wcaHint")}</p>
          </div>
          {hasWcaId ? (
            <Link
              href="/profile"
              className={`${buttonClass("secondary", "sm")}`}
            >
              {t("timer.wcaProfile")}
            </Link>
          ) : (
            <Link
              href="/profile"
              className={`${buttonClass("secondary", "sm")}`}
            >
              {t("timer.wcaLink")}
            </Link>
          )}
        </div>
        {!hasWcaId ? (
          <div className="rounded-panel px-4 py-3 text-sm bg-surface-2 text-ink mt-4 mb-0">
            {t("timer.wcaLinkHint")}
          </div>
        ) : loading ? (
          <div className="mt-4">
            <span className="block h-3 rounded-full bg-surface-3 w-8/12" />
            <span className="block h-3 rounded-full bg-surface-3 w-5/12 mt-2" />
          </div>
        ) : unavailable ? (
          <div className="rounded-panel px-4 py-3 text-sm bg-warning-soft text-ink mt-4 mb-0">
            {t("timer.wcaUnavailable")}
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto mt-4">
              <table className="w-full text-left text-sm [&_th]:px-3 [&_th]:py-2.5 [&_th]:align-middle [&_th]:font-semibold [&_th]:text-muted [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-middle [&_th]:py-1.5 [&_td]:py-1.5 align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">{t("timer.wcaMetricColumn")}</th>
                    <th scope="col">Timer</th>
                    <th scope="col">WCA</th>
                    <th scope="col">{t("timer.wcaDeltaColumn")}</th>
                    {hasTargets ? <th scope="col">{t("timer.wcaWorldRecord")}</th> : null}
                    {hasTargets && national ? <th scope="col">{t("timer.wcaNationalRecord")}</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.key}>
                      <th scope="row">{row.label}</th>
                      <td>
                        {row.timerMs === null
                          ? "—"
                          : formatSolveTime(row.timerMs)}
                      </td>
                      <td>
                        {row.wcaMs === null ? "—" : formatSolveTime(row.wcaMs)}
                      </td>
                      <td
                        className={
                          row.deltaMs === null
                            ? "text-muted"
                            : row.deltaMs < 0
                              ? "text-success"
                              : row.deltaMs > 0
                                ? "text-primary"
                                : "text-muted"
                        }
                      >
                        {wcaDeltaMessage(row.deltaMs, t)}
                      </td>
                      {hasTargets ? (
                        <td>
                          <RecordGap valueMs={targets.find(item => item.key === row.key)?.worldMs ?? null} gapMs={targets.find(item => item.key === row.key)?.worldGapMs ?? null} />
                        </td>
                      ) : null}
                      {hasTargets && national ? (
                        <td>
                          <RecordGap valueMs={targets.find(item => item.key === row.key)?.nationalMs ?? null} gapMs={targets.find(item => item.key === row.key)?.nationalGapMs ?? null} />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!hasRecord ? (
              <p className="text-sm text-muted mt-2 mb-0">
                {t("timer.wcaNoRecord", { event: eventLabel })}
              </p>
            ) : (
              <p className="text-sm text-muted mt-2 mb-0">
                {t("timer.wcaAo5Note")}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

