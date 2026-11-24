import type { SolveHistoryEntry, SplitPhase } from "@/lib/solveHistory";
import { analyzeSolve } from "@/features/timer/lib/solveAnalysis";
import { deriveMarks } from "@/features/timer/lib/solveMarks";

export const PHASE_TREND_SOLVES = 30;
export const PHASE_TREND_ORDER: readonly SplitPhase[] = ["Cross", "F2L", "OLL", "PLL"];

export type PhaseTrendRow = {
  solve: number;
  crossRecognition: number | null;
  crossExecution: number | null;
  f2lRecognition: number | null;
  f2lExecution: number | null;
  ollRecognition: number | null;
  ollExecution: number | null;
  pllRecognition: number | null;
  pllExecution: number | null;
};

type PhaseMetricKey = Exclude<keyof PhaseTrendRow, "solve">;

const key = (phase: SplitPhase, metric: "Recognition" | "Execution") =>
  `${phase.toLowerCase()}${metric}` as PhaseMetricKey;

const seconds = (ms: number) => Math.round((ms / 1000) * 100) / 100;

function isThreeByThree(entry: SolveHistoryEntry) {
  return entry.eventId === undefined || entry.eventId === "333";
}

/**
 * Xu hướng nhận diện và thực hiện theo từng giai đoạn của các solve 3×3 có nhịp
 * từng nước. Mốc giai đoạn được tính lại từ chuỗi nước nên cross không ở D vẫn
 * vào đúng cột.
 */
export function phaseTrend(entries: readonly SolveHistoryEntry[]): PhaseTrendRow[] {
  const usable = entries
    .filter(
      entry =>
        isThreeByThree(entry) &&
        entry.inputKind === "scramble" &&
        Boolean(entry.solution.trim()) &&
        Boolean(entry.moveTimes?.length)
    )
    .slice(0, PHASE_TREND_SOLVES)
    .reverse();

  const rows: PhaseTrendRow[] = [];
  for (const entry of usable) {
    const moves = entry.solution.trim().split(/\s+/);
    const moveTimes = entry.moveTimes!;
    if (moves.length !== moveTimes.length) continue;
    const marks = deriveMarks(entry.input, moves);
    const analysis = analyzeSolve({ moves, moveTimes, phaseSplits: entry.phaseSplits, marks });
    if (!analysis) continue;
    const row: PhaseTrendRow = {
      solve: rows.length + 1,
      crossRecognition: null,
      crossExecution: null,
      f2lRecognition: null,
      f2lExecution: null,
      ollRecognition: null,
      ollExecution: null,
      pllRecognition: null,
      pllExecution: null,
    };
    for (const phase of analysis.phases) {
      if (!phase.turns) continue;
      row[key(phase.phase, "Recognition")] =
        phase.recognitionMs === null ? null : seconds(phase.recognitionMs);
      row[key(phase.phase, "Execution")] = seconds(phase.executionMs);
    }
    rows.push(row);
  }
  return rows;
}
