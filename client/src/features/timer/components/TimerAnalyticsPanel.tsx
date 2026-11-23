/** Mục gập "Phân tích" của trang Bấm giờ: tiến bộ theo loại khối, so sánh WCA, số liệu, biểu đồ và hiệu suất lời giải gần nhất. */
import { ChevronDown } from "@/components/ui/Icon";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type TimerEventId } from "@/lib/timerEvents";
import { progressSeries, solutionEfficiency } from "../lib/timerAnalysis";
import { wcaTimerComparison } from "@/features/wca/lib/wcaTimerComparison";
import { type SolveHistoryEntry } from "@/lib/solveHistory";
import { useLanguage } from "@/contexts/LanguageContext";
import { StatTile } from "@/components/ui/StudioUI";

import { EventProgressCard } from "./EventProgressCard";
import { EventWcaComparisonCard } from "./EventWcaComparisonCard";
import { TimerInsightsPanel } from "./TimerInsightsPanel";

import type { TimerAverages } from "../lib/useTimerMetrics";

export function TimerAnalyticsPanel({
  isMultiBlind,
  eventId,
  eventLabel,
  eventEntries,
  progress,
  eventWcaRows,
  hasWcaId,
  wcaLoading,
  wcaUnavailable,
  hasWcaRecord,
  pb,
  averages,
  totalCount,
  formatMetric,
  latestSolution,
  latestEfficiency,
}: {
  isMultiBlind: boolean;
  eventId: TimerEventId;
  eventLabel: string;
  eventEntries: SolveHistoryEntry[];
  progress: ReturnType<typeof progressSeries>;
  eventWcaRows: ReturnType<typeof wcaTimerComparison>;
  hasWcaId: boolean;
  wcaLoading: boolean;
  wcaUnavailable: boolean;
  hasWcaRecord: boolean;
  pb: number | null | undefined;
  averages: TimerAverages;
  totalCount: number;
  formatMetric: (value: number | null | undefined) => string;
  latestSolution: SolveHistoryEntry | undefined;
  latestEfficiency: ReturnType<typeof solutionEfficiency> | null;
}) {
  const { language, t } = useLanguage();
  return (
    <details
      data-focus-hide
      className="group mt-6 rounded-card bg-surface"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-base font-semibold tracking-tight sm:px-6">
        {t("timer.analyticsTitle")}
        <ChevronDown
          aria-hidden="true"
          className="text-base text-muted transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="grid grid-cols-12 gap-6 px-5 pb-6 sm:px-6">
        {!isMultiBlind && (
          <section className="col-span-12">
            <EventProgressCard
              eventLabel={eventLabel}
              entries={eventEntries}
              progress={progress}
            />
          </section>
        )}
        {!isMultiBlind && (
          <section className="col-span-12">
            <EventWcaComparisonCard
              eventId={eventId}
              eventLabel={eventLabel}
              rows={eventWcaRows}
              hasWcaId={hasWcaId}
              loading={wcaLoading}
              unavailable={wcaUnavailable}
              hasRecord={hasWcaRecord}
            />
          </section>
        )}

        <section
          className="col-span-12"
          aria-labelledby="timer-analytics-heading"
        >
          {/* Tiêu đề đã nằm ở <summary>; giữ cho trình đọc màn hình. */}
          <h2 id="timer-analytics-heading" className="sr-only">
            {t("timer.analyticsTitle")}
          </h2>
          <div className="flex flex-col gap-6">
            <section className="grid grid-cols-12 gap-6">
              <div className="col-span-12 xl:col-span-4 rounded-card bg-surface p-5 sm:p-6">
                <h3 className="text-sm font-semibold tracking-tight">
                  {t("timer.stats")}
                </h3>
                <div className="grid grid-cols-12 gap-2 mt-6">
                  {(
                    [
                      [t("timer.pb"), formatMetric(pb)],
                      ["AO5", formatMetric(averages.ao5)],
                      ["AO12", formatMetric(averages.ao12)],
                      ["AO50", formatMetric(averages.ao50)],
                      ["AO100", formatMetric(averages.ao100)],
                      [t("timer.total"), String(totalCount)],
                    ] as const
                  ).map(([label, value]) => (
                    // Hai ô mỗi hàng: ô hẹp (1/3 card) không đủ chỗ cho
                    // thời gian dài như "83:20.00", chữ sẽ tràn ra ngoài.
                    <div key={label} className="col-span-6">
                      <StatTile label={label} value={value} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-12 xl:col-span-8 rounded-card bg-surface p-5 sm:p-6">
                <h3 className="text-sm font-semibold tracking-tight">
                  {t("timer.progress")}
                </h3>
                {totalCount ? (
                  <div className="h-72 mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progress}>
                        <XAxis
                          dataKey="solve"
                          type="number"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={value =>
                            `${(Number(value) / 1000).toFixed(0)}s`
                          }
                          axisLine={false}
                          tickLine={false}
                          width={56}
                        />
                        <Tooltip
                          formatter={value => [
                            value == null
                              ? "DNF"
                              : `${(Number(value) / 1000).toFixed(2)}s`,
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="ao5"
                          stroke="var(--chart-1)"
                          strokeWidth={3}
                          dot={false}
                          connectNulls
                          name="Ao5"
                        />
                        <Line
                          type="monotone"
                          dataKey="ao12"
                          stroke="var(--chart-2)"
                          strokeWidth={2}
                          dot={false}
                          connectNulls
                          name="Ao12"
                        />
                        <Line
                          type="monotone"
                          dataKey="ao50"
                          stroke="var(--chart-3)"
                          strokeWidth={2}
                          strokeDasharray="5 3"
                          dot={false}
                          connectNulls
                          name="Ao50"
                        />
                        <Line
                          type="monotone"
                          dataKey="ao100"
                          stroke="var(--chart-4)"
                          strokeWidth={2}
                          strokeDasharray="2 4"
                          dot={false}
                          connectNulls
                          name="Ao100"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="rounded-panel px-4 py-3 text-sm bg-surface-2 text-ink mt-6">
                    {t("timer.chartEmpty")}
                  </div>
                )}
              </div>
            </section>

            {!isMultiBlind && <TimerInsightsPanel entries={eventEntries} />}

            <section className="rounded-card bg-surface mt-6">
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="text-sm font-semibold tracking-tight mb-0">
                    {t("timer.efficiency")}
                  </h3>
                  {latestSolution && (
                    <span className="text-sm text-muted">
                      {new Date(
                        latestSolution.createdAt
                      ).toLocaleDateString(
                        language === "vi" ? "vi-VN" : "en-US"
                      )}
                    </span>
                  )}
                </div>
                {latestEfficiency ? (
                  <div className="grid grid-cols-12 gap-4 mt-1">
                    <div className="col-span-12 md:col-span-6">
                      <StatTile
                        label={t("timer.moves")}
                        value={String(latestEfficiency.moves)}
                        tone="dark"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <StatTile
                        label={t("timer.tps")}
                        value={latestEfficiency.tps.toFixed(2)}
                        tone="dark"
                      />
                    </div>
                    <div className="col-span-12">
                      <StatTile
                        label="RATING"
                        value={latestEfficiency.label}
                        tone="dark"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-panel px-4 py-3 text-sm bg-surface-2 text-ink mt-4 mb-0">
                    {t("timer.noSolutionToAnalyze")}
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </details>
  );
}
