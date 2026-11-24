import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PillGroup } from "@/components/ui/DesignSystem";
import { StatTile } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatSolveTime, type SolveHistoryEntry } from "@/lib/solveHistory";
import {
  dailyHeatmap,
  monthComparison,
  subXStreak,
  suggestSubXThresholds,
  timeDistribution,
  weekComparison,
  type HeatmapDay,
  type PeriodComparison,
} from "../lib/timerInsights";

const HEATMAP_DAYS = 84;

const LEVEL_CLASS: Record<HeatmapDay["level"], string> = {
  0: "bg-surface-2",
  1: "bg-primary/25",
  2: "bg-primary/50",
  3: "bg-primary/75",
  4: "bg-primary",
};

function seconds(ms: number) {
  return `${(ms / 1000).toFixed(ms % 1000 === 0 ? 0 : 1)}s`;
}

function signedSeconds(ms: number) {
  const value = (ms / 1000).toFixed(2);
  return ms > 0 ? `+${value}s` : `${value}s`;
}

function PeriodRow({
  label,
  comparison,
}: {
  label: string;
  comparison: PeriodComparison;
}) {
  const { t } = useLanguage();
  const time = (ms: number | null) => (ms === null ? "—" : formatSolveTime(ms));
  const delta = comparison.meanDeltaMs;
  return (
    <tr>
      <th scope="row" className="py-2 pr-4 text-left font-semibold">
        {label}
      </th>
      <td className="py-2 pr-4">
        {comparison.current.count} / {comparison.previous.count}
      </td>
      <td className="py-2 pr-4">
        {time(comparison.current.meanMs)} / {time(comparison.previous.meanMs)}
      </td>
      <td className="py-2 pr-4">
        {time(comparison.current.bestMs)} / {time(comparison.previous.bestMs)}
      </td>
      <td
        className={
          delta === null
            ? "py-2 text-muted"
            : delta <= 0
              ? "py-2 font-semibold text-success"
              : "py-2 font-semibold text-danger"
        }
      >
        {delta === null
          ? t("timer.insights.noCompare")
          : `${signedSeconds(delta)} ${delta <= 0 ? t("timer.insights.faster") : t("timer.insights.slower")}`}
      </td>
    </tr>
  );
}

export function TimerInsightsPanel({
  entries,
}: {
  entries: SolveHistoryEntry[];
}) {
  const { language, t } = useLanguage();
  const bins = useMemo(() => timeDistribution(entries), [entries]);
  const heatmap = useMemo(
    () => dailyHeatmap(entries, HEATMAP_DAYS),
    [entries]
  );
  const thresholds = useMemo(() => suggestSubXThresholds(entries), [entries]);
  const [picked, setPicked] = useState<string>("");
  const threshold = thresholds.includes(Number(picked))
    ? Number(picked)
    : (thresholds[0] ?? 0);
  const streak = useMemo(
    () => (threshold ? subXStreak(entries, threshold) : null),
    [entries, threshold]
  );
  const week = useMemo(() => weekComparison(entries), [entries]);
  const month = useMemo(() => monthComparison(entries), [entries]);
  const locale = language === "vi" ? "vi-VN" : "en-US";
  const leadingBlanks = heatmap.length
    ? (new Date(heatmap[0].date).getDay() + 6) % 7
    : 0;
  const activeDays = heatmap.filter(day => day.count > 0).length;

  if (!entries.length)
    return (
      <div className="rounded-panel px-4 py-3 text-sm bg-surface-2 text-ink mb-0">
        {t("timer.insights.empty")}
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-card bg-surface p-5 sm:p-6">
        <h3 className="text-sm font-semibold tracking-tight">
          {t("timer.insights.distribution")}
        </h3>
        <p className="mt-1 mb-0 text-sm text-muted">
          {t("timer.insights.distributionHint")}
        </p>
        <div className="h-56 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bins}>
              <XAxis
                dataKey="fromMs"
                tickFormatter={value => seconds(Number(value))}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                labelFormatter={value => {
                  const bin = bins.find(item => item.fromMs === Number(value));
                  return bin
                    ? `${formatSolveTime(bin.fromMs)} – ${formatSolveTime(bin.toMs)}`
                    : "";
                }}
                formatter={value => [
                  t("timer.solveCount", { count: Number(value) }),
                  "",
                ]}
              />
              <Bar
                dataKey="count"
                fill="var(--chart-1)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-card bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold tracking-tight">
            {t("timer.insights.heatmap")}
          </h3>
          <span className="text-sm text-muted">
            {t("timer.insights.activeDays", {
              count: activeDays,
              total: HEATMAP_DAYS,
            })}
          </span>
        </div>
        <div
          role="img"
          aria-label={t("timer.insights.heatmapLabel", {
            count: activeDays,
            total: HEATMAP_DAYS,
          })}
          className="mt-4 grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1"
          style={{ gridAutoColumns: "0.875rem" }}
        >
          {Array.from({ length: leadingBlanks }, (_, index) => (
            <span key={`blank-${index}`} aria-hidden="true" />
          ))}
          {heatmap.map(day => (
            <span
              key={day.key}
              title={t("timer.insights.heatmapCell", {
                date: new Date(day.date).toLocaleDateString(locale),
                count: day.count,
              })}
              className={`size-3.5 rounded-sm ${LEVEL_CLASS[day.level]}`}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-1 text-xs text-muted">
          {t("timer.insights.less")}
          {([0, 1, 2, 3, 4] as const).map(level => (
            <span
              key={level}
              aria-hidden="true"
              className={`size-3.5 rounded-sm ${LEVEL_CLASS[level]}`}
            />
          ))}
          {t("timer.insights.more")}
        </div>
      </section>

      <section className="rounded-card bg-surface p-5 sm:p-6">
        <h3 className="text-sm font-semibold tracking-tight">
          {t("timer.insights.subX")}
        </h3>
        {streak && thresholds.length ? (
          <>
            <PillGroup
              className="mt-3"
              size="sm"
              label={t("timer.insights.subXThreshold")}
              value={String(threshold)}
              onChange={setPicked}
              options={thresholds.map(value => ({
                value: String(value),
                label: `Sub-${seconds(value)}`,
              }))}
            />
            <div className="grid grid-cols-12 gap-2 mt-4">
              <div className="col-span-6">
                <StatTile
                  label={t("timer.insights.streakCurrent")}
                  value={String(streak.current)}
                />
              </div>
              <div className="col-span-6">
                <StatTile
                  label={t("timer.insights.streakBest")}
                  value={String(streak.best)}
                />
              </div>
            </div>
          </>
        ) : (
          <p className="mt-2 mb-0 text-sm text-muted">
            {t("timer.insights.subXEmpty")}
          </p>
        )}
      </section>

      <section className="rounded-card bg-surface p-5 sm:p-6">
        <h3 className="text-sm font-semibold tracking-tight">
          {t("timer.insights.compare")}
        </h3>
        <p className="mt-1 mb-0 text-sm text-muted">
          {t("timer.insights.compareHint")}
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th scope="col" className="pb-2 pr-4 text-left font-semibold" />
                <th scope="col" className="pb-2 pr-4 text-left font-semibold">
                  {t("timer.insights.colCount")}
                </th>
                <th scope="col" className="pb-2 pr-4 text-left font-semibold">
                  {t("timer.insights.colMean")}
                </th>
                <th scope="col" className="pb-2 pr-4 text-left font-semibold">
                  {t("timer.insights.colBest")}
                </th>
                <th scope="col" className="pb-2 text-left font-semibold">
                  {t("timer.insights.colTrend")}
                </th>
              </tr>
            </thead>
            <tbody>
              <PeriodRow label={t("timer.insights.week")} comparison={week} />
              <PeriodRow label={t("timer.insights.month")} comparison={month} />
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
