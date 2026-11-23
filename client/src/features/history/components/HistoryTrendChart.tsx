import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import type { HistoryTrendPoint } from "../lib/historyView";

/** Biểu đồ thời gian từng lượt và ao5 của 30 lượt gần nhất. */
export function HistoryTrendChart({ chart }: { chart: HistoryTrendPoint[] }) {
  const { t } = useLanguage();
  return (
    <section className="rounded-card bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight mb-0">
          {t("history.trendTitle")}
        </h2>
        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-primary/40" aria-hidden="true" />
            {t("history.timeLabel")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1 w-4 rounded-full bg-primary" aria-hidden="true" />
            ao5
          </span>
        </div>
      </div>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="solve" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} />
            <YAxis
              tickFormatter={value => `${value}s`}
              axisLine={false}
              tickLine={false}
              width={48}
              domain={["auto", "auto"]}
              tick={{ fontSize: 12, fill: "var(--muted)" }}
            />
            <Tooltip
              cursor={{ stroke: "var(--surface-3)", strokeWidth: 1 }}
              contentStyle={{
                background: "var(--surface-2)",
                border: "none",
                borderRadius: 14,
                boxShadow: "none",
                color: "var(--ink)",
              }}
              labelFormatter={value => t("history.solveNumber", { number: String(value) })}
              formatter={(value, name) => [
                value === null || value === undefined ? "DNF" : `${value}s`,
                name === "ao5" ? "ao5" : t("history.timeLabel"),
              ]}
            />
            <Line
              type="monotone"
              dataKey="seconds"
              stroke="var(--primary)"
              strokeOpacity={0.4}
              strokeWidth={1.5}
              dot={{ r: 2.5, fill: "var(--primary)", fillOpacity: 0.45, strokeWidth: 0 }}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="ao5"
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
