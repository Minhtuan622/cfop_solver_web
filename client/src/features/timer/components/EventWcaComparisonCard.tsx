/** Thẻ so sánh thành tích Timer với kỷ lục WCA cá nhân của loại khối đang chọn. */
import { Link } from "wouter";
import { type TimerEventId } from "@/lib/timerEvents";
import { type WcaTimerComparisonRow } from "@/features/wca/lib/wcaTimerComparison";
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

