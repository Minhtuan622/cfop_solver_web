import { useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SplitPhase } from "@/lib/solveHistory";
import { PHASE_TREND_ORDER, type PhaseTrendRow } from "../lib/phaseTrend";

const METRICS = ["Recognition", "Execution"] as const;
type Metric = (typeof METRICS)[number];

const lineKey = (phase: SplitPhase, metric: Metric) =>
  `${phase.toLowerCase()}${metric}` as keyof PhaseTrendRow;

export function HistoryPhaseTrendChart({ rows }: { rows: PhaseTrendRow[] }) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<SplitPhase>("F2L");

  return (
    <section
      className="rounded-card bg-surface p-5 sm:p-6"
      data-testid="history-phase-trend"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight mb-0">
            {t("history.phaseTrendTitle")}
          </h2>
          <p className="mt-1 mb-0 text-sm text-muted">
            {t("history.phaseTrendHint")}
          </p>
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t("history.phaseTrendSelect")}
        >
          {PHASE_TREND_ORDER.map(item => (
            <Button
              key={item}
              variant={phase === item ? "primary" : "soft"}
              size="xs"
              aria-pressed={phase === item}
              onClick={() => setPhase(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      {rows.length ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-0.5 w-4 rounded-full"
                aria-hidden="true"
                style={{ backgroundColor: "var(--chart-2)" }}
              />
              {t("history.recognition")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-0.5 w-4 rounded-full"
                aria-hidden="true"
                style={{ backgroundColor: "var(--chart-1)" }}
              />
              {t("history.execution")}
            </span>
          </div>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={rows}
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              >
                <XAxis
                  dataKey="solve"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted)" }}
                />
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
                  labelFormatter={value =>
                    t("history.solveNumber", { number: String(value) })
                  }
                  formatter={(value, name) => [
                    value === null || value === undefined ? "—" : `${value}s`,
                    name === "recognition"
                      ? t("history.recognition")
                      : t("history.execution"),
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey={lineKey(phase, "Recognition")}
                  name="recognition"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey={lineKey(phase, "Execution")}
                  name="execution"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-panel bg-surface-2 px-4 py-3 text-sm text-ink">
          {t("history.phaseTrendEmpty")}
        </div>
      )}
    </section>
  );
}
