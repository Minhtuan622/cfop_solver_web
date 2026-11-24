import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { progressSeries } from "../lib/timerAnalysis";
import { formatSolveTime, type SolveHistoryEntry } from "@/lib/solveHistory";
import { useLanguage } from "@/contexts/LanguageContext";

export function EventProgressCard({
  eventLabel,
  entries,
  progress,
}: {
  eventLabel: string;
  entries: SolveHistoryEntry[];
  progress: ReturnType<typeof progressSeries>;
}) {
  const { t } = useLanguage();
  return (
    <div className="rounded-card bg-surface h-full">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold tracking-tight mb-1">
              {t("timer.eventProgress", { event: eventLabel })}
            </h2>
            <p className="text-sm text-muted mb-0">
              {t("timer.eventProgressHint")}
            </p>
          </div>
          <span className="text-sm text-muted">
            {t("timer.solveCount", { count: entries.length })}
          </span>
        </div>
        {entries.length ? (
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progress}>
                <XAxis dataKey="solve" axisLine={false} tickLine={false} />
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
                    value == null ? "DNF" : formatSolveTime(Number(value)),
                    "",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="single"
                  stroke="var(--chart-6)"
                  strokeWidth={1.5}
                  dot={{ r: 2 }}
                  connectNulls
                  name="Single"
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
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-panel px-4 py-3 text-sm bg-info-soft text-ink mt-4 mb-0">
            {t("timer.firstSolveHint", { event: eventLabel })}
          </div>
        )}
      </div>
    </div>
  );
}

