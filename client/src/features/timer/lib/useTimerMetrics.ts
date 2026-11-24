import { useMemo } from "react";
import { effectiveTime, type SolveHistoryEntry } from "@/lib/solveHistory";
import { metricEvidence } from "@/lib/timerRecords";
import { progressSeries, TIMER_AVERAGE_SIZES } from "./timerAnalysis";

const AVERAGES = TIMER_AVERAGE_SIZES;

export type TimerAverages = Record<
  `ao${(typeof AVERAGES)[number]}`,
  number | null | undefined
>;

export function useTimerMetrics(visibleEntries: SolveHistoryEntry[], isMultiBlind: boolean) {
  const progress = useMemo(
    () => progressSeries(visibleEntries),
    [visibleEntries]
  );
  const pb = useMemo(() => {
    if (isMultiBlind) return metricEvidence(visibleEntries, "pb").value;
    const values = visibleEntries
      .map(effectiveTime)
      .filter((value): value is number => value !== null);
    return values.length ? Math.min(...values) : undefined;
  }, [isMultiBlind, visibleEntries]);
  const averages = useMemo(
    () =>
      isMultiBlind
        ? (Object.fromEntries(
            AVERAGES.map(size => [`ao${size}`, undefined])
          ) as Record<
            `ao${(typeof AVERAGES)[number]}`,
            number | null | undefined
          >)
        : (Object.fromEntries(
            AVERAGES.map(size => [`ao${size}`, progress.at(-1)?.[`ao${size}`]])
          ) as Record<
            `ao${(typeof AVERAGES)[number]}`,
            number | null | undefined
          >),
    [isMultiBlind, progress]
  ) as TimerAverages;
  return { progress, pb, averages };
}
