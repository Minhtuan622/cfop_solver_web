import Papa from "papaparse";
import {
  effectiveTime,
  formatSolveResult,
  type SolveHistoryEntry,
} from "@/lib/solveHistory";
import { rollingAverage } from "@/lib/timerRecords";
import { normalizeTimerEventId, type TimerEventId } from "@/lib/timerEvents";

export const CHART_SOLVES = 30;
export const HISTORY_PAGE_SIZE = 50;

export type HistoryFilter = {
  query: string;
  tag: string;
  eventFilter: "all" | TimerEventId;
};

export function average(values: number[]) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

export function historyTags(entries: SolveHistoryEntry[]) {
  return Array.from(new Set(entries.flatMap(item => item.tags))).sort((a, b) =>
    a.localeCompare(b)
  );
}

export function filterHistory(
  entries: SolveHistoryEntry[],
  { query, tag, eventFilter }: HistoryFilter
) {
  return entries.filter(item => {
    const haystack =
      `${item.input} ${item.multiBlindScrambles?.join(" ") ?? ""} ${item.note} ${item.tags.join(" ")}`.toLocaleLowerCase();
    return (
      (eventFilter === "all" ||
        normalizeTimerEventId(item.eventId) === eventFilter) &&
      (tag === "all" || item.tags.includes(tag)) &&
      (!query.trim() || haystack.includes(query.trim().toLocaleLowerCase()))
    );
  });
}

export function validTimes(entries: SolveHistoryEntry[]) {
  return entries.flatMap(item => {
    const time = effectiveTime(item);
    return time === null ? [] : [time];
  });
}

export type HistoryTrendPoint = {
  solve: number;
  seconds: number | null;
  ao5: number | null;
};

export function historyTrend(entries: SolveHistoryEntry[]): HistoryTrendPoint[] {
  const chronological = entries.slice(0, CHART_SOLVES + 4).reverse();
  const toSeconds = (ms: number | null) =>
    ms === null ? null : Number((ms / 1000).toFixed(2));
  return chronological
    .map((item, index) => ({
      seconds: toSeconds(effectiveTime(item)),
      ao5:
        index >= 4
          ? toSeconds(rollingAverage(chronological.slice(index - 4, index + 1)))
          : null,
    }))
    .slice(-CHART_SOLVES)
    .map((point, index) => ({ solve: index + 1, ...point }));
}

export function historyCsv(entries: SolveHistoryEntry[]) {
  const rows: (string | number | null | undefined)[][] = [
    [
      "timestamp",
      "event",
      "base_time_ms",
      "inspection_ms",
      "penalty",
      "result",
      "scramble",
      "mbl_scrambles",
      "solution",
      "note",
      "tags",
    ],
    ...entries.map(item => [
      new Date(item.createdAt).toISOString(),
      normalizeTimerEventId(item.eventId),
      item.elapsedMs,
      item.inspectionMs,
      item.penalty,
      formatSolveResult(item),
      item.input,
      item.multiBlindScrambles?.join("\n") ?? "",
      item.solution,
      item.note,
      item.tags.join("|"),
    ]),
  ];
  return Papa.unparse(rows, { quotes: true, newline: "\n" });
}
