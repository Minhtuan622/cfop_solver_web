import { effectiveTime, formatSolveTime, type SolveHistoryEntry, type SplitPhase } from "./solveHistory";
import { rollingAverage } from "./timerRecords";

export const TIMER_AVERAGE_SIZES = [5, 12, 50, 100] as const;
export type TimerAverageSize = (typeof TIMER_AVERAGE_SIZES)[number];
export type PhaseTps = { phase: "Cross" | "F2L" | "OLL" | "PLL"; tps: number; moves: number; seconds: number };

export function progressSeries(entries: SolveHistoryEntry[]) {
  const ordered = [...entries].reverse();
  return ordered.map((entry, index) => {
    const point: Record<string, number | null | undefined> = { solve: index + 1, single: effectiveTime(entry) };
    for (const size of TIMER_AVERAGE_SIZES) point[`ao${size}`] = index + 1 < size ? undefined : rollingAverage(ordered.slice(index + 1 - size, index + 1));
    return point;
  });
}

export function splitSummary(entry: SolveHistoryEntry) {
  return entry.phaseSplits.map((split) => `${split.phase} ${(split.elapsedMs / 1000).toFixed(2)}s`).join(" · ");
}

export function phaseProgressSeries(entries: SolveHistoryEntry[]) {
  return [...entries].reverse().map((entry, index) => {
    const point: Record<string, number | undefined> = { solve: index + 1 };
    entry.phaseSplits.forEach((split) => { point[split.phase] = split.elapsedMs; });
    return point;
  });
}

function phaseAverage(values: number[], windowSize: 5 | 12) {
  if (values.length < windowSize) return undefined;
  const sample = values.slice(0, windowSize).sort((a, b) => a - b);
  const core = sample.slice(1, -1);
  return core.reduce((sum, value) => sum + value, 0) / core.length;
}

export function phaseStability(entries: SolveHistoryEntry[], phases: readonly SplitPhase[]) {
  return Object.fromEntries(phases.map((phase) => {
    const values = entries.flatMap((entry) => entry.phaseSplits.filter((split) => split.phase === phase).map((split) => split.elapsedMs));
    return [phase, { count: values.length, ao5: phaseAverage(values, 5), ao12: phaseAverage(values, 12) }];
  })) as Record<SplitPhase, { count: number; ao5: number | undefined; ao12: number | undefined }>;
}

const MOVE_TOKEN = /(?:[URFDLBMESxyz](?:w)?(?:2|')?)/g;

export function solutionEfficiency(entry: SolveHistoryEntry) {
  const moves = (entry.solution.match(MOVE_TOKEN) ?? []).length;
  const seconds = entry.elapsedMs / 1000;
  const tps = moves && seconds > 0 ? moves / seconds : 0;
  const label = !moves ? "—" : moves <= 45 && tps >= 3 ? "STRONG" : moves <= 60 || tps >= 2.5 ? "STEADY" : "REFINE";
  return { moves, tps, label };
}

export function phaseTpsFromSolution(solution: string): PhaseTps[] {
  const buckets = new Map<PhaseTps["phase"], { moves: number; seconds: number }>();
  for (const part of solution.split(/[|;\n]+/)) {
    const match = part.trim().match(/^(Cross|F2L(?:\s*[1-4])?|OLL|PLL)\s*(?:@|:)\s*([0-9]+(?:\.[0-9]+)?)s?\s*(.*)$/i);
    if (!match) continue;
    const phase = match[1].toUpperCase().startsWith("F2L") ? "F2L" : (match[1][0].toUpperCase() + match[1].slice(1).toLowerCase()) as PhaseTps["phase"];
    const moves = (match[3].match(MOVE_TOKEN) ?? []).length;
    const seconds = Number(match[2]);
    if (moves > 0 && seconds > 0) {
      const current = buckets.get(phase) ?? { moves: 0, seconds: 0 };
      current.moves += moves;
      current.seconds += seconds;
      buckets.set(phase, current);
    }
  }
  return (["Cross", "F2L", "OLL", "PLL"] as const).flatMap((phase) => {
    const item = buckets.get(phase);
    return item ? [{ phase, ...item, tps: item.moves / item.seconds }] : [];
  });
}

export function formatPhaseTarget(value: number | undefined) {
  return value === undefined ? "—" : formatSolveTime(value);
}
