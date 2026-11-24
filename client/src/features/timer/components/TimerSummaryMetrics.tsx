import { BarChart3 } from "@/components/ui/Icon";
import { Link } from "wouter";
import { type TimerMetricKey } from "@/lib/timerRecords";
import { useLanguage } from "@/contexts/LanguageContext";
import { MetricButton } from "../TimerMetricCards";

import { buttonClass } from "@/components/ui/Button";

import type { TimerAverages } from "../lib/useTimerMetrics";

export function TimerSummaryMetrics({
  isMultiBlind,
  pb,
  averages,
  totalCount,
  formatMetric,
  onSelectMetric,
}: {
  isMultiBlind: boolean;
  pb: number | null | undefined;
  averages: TimerAverages;
  totalCount: number;
  formatMetric: (value: number | null | undefined) => string;
  onSelectMetric: (key: TimerMetricKey) => void;
}) {
  const { t } = useLanguage();
  return (
    <section
      data-focus-hide
      aria-labelledby="timer-summary-heading"
      className="mt-6 rounded-card bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="timer-summary-heading"
          className="flex items-center gap-2 text-base font-semibold tracking-tight"
        >
          <BarChart3
            className="text-lg text-muted"
            aria-hidden="true"
          />
          {t("timer.summary")}
        </h2>
        <Link
          href="/history"
          className={buttonClass("secondary", "sm")}
        >
          {t("timer.openHistory")}
        </Link>
      </div>
      <div className="grid grid-cols-12 gap-2 mt-4">
        <div className="col-span-6 sm:col-span-4 lg:col-span-2">
          <MetricButton
            label={isMultiBlind ? t("timer.bestScore") : t("timer.pb")}
            value={formatMetric(pb)}
            enabled={pb !== undefined}
            onClick={() => onSelectMetric("pb")}
          />
        </div>
        {!isMultiBlind && (
          <>
            <div className="col-span-6 sm:col-span-4 lg:col-span-2">
              <MetricButton
                label="AO5"
                value={formatMetric(averages.ao5)}
                enabled={averages.ao5 !== undefined}
                onClick={() => onSelectMetric("ao5")}
              />
            </div>
            <div className="col-span-6 sm:col-span-4 lg:col-span-2">
              <MetricButton
                label="AO12"
                value={formatMetric(averages.ao12)}
                enabled={averages.ao12 !== undefined}
                onClick={() => onSelectMetric("ao12")}
              />
            </div>
            <div className="col-span-6 sm:col-span-4 lg:col-span-2">
              <MetricButton
                label="AO50"
                value={formatMetric(averages.ao50)}
                enabled={averages.ao50 !== undefined}
                onClick={() => onSelectMetric("ao50")}
              />
            </div>
            <div className="col-span-6 sm:col-span-4 lg:col-span-2">
              <MetricButton
                label="AO100"
                value={formatMetric(averages.ao100)}
                enabled={averages.ao100 !== undefined}
                onClick={() => onSelectMetric("ao100")}
              />
            </div>
          </>
        )}
        <div className="col-span-6 sm:col-span-4 lg:col-span-2">
          <MetricButton
            label={t("timer.total")}
            value={String(totalCount)}
            enabled={totalCount > 0}
            onClick={() => onSelectMetric("total")}
          />
        </div>
      </div>
    </section>
  );
}
