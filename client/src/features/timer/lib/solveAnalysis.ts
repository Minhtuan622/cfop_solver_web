import {
  SOLVED_FAST_STATE,
  applyFastMoves,
  stateFromScramble,
} from "@/lib/fastCube";
import type { SolvePhaseSplit, SplitPhase } from "@/lib/solveHistory";

export type TurnMove = {
  move: string;
  at: number;
  from: number;
  to: number;
};

const FACE_SUFFIX = ["", "", "2", "'"] as const;

export function mergeTurns(moves: readonly string[], times: readonly number[]): TurnMove[] {
  const merged: Array<TurnMove & { face: string; quarter: number }> = [];
  moves.forEach((raw, index) => {
    const match = /^([URFDLBMESxyz])(2|')?$/.exec(raw.trim());
    if (!match) {
      merged.push({ move: raw, at: times[index] ?? 0, from: index, to: index + 1, face: raw, quarter: 0 });
      return;
    }
    const [, face, suffix] = match;
    const quarter = suffix === "2" ? 2 : suffix === "'" ? 3 : 1;
    const last = merged.at(-1);
    if (last && last.face === face && last.quarter > 0) {
      last.quarter = (last.quarter + quarter) % 4;
      last.at = times[index] ?? last.at;
      last.to = index + 1;
      last.move = last.quarter === 0 ? "" : `${face}${FACE_SUFFIX[last.quarter]}`;
      return;
    }
    merged.push({
      move: `${face}${FACE_SUFFIX[quarter]}`,
      at: times[index] ?? 0,
      from: index,
      to: index + 1,
      face,
      quarter,
    });
  });
  return merged
    .filter(item => item.move !== "")
    .map(({ move, at, from, to }) => ({ move, at, from, to }));
}

export type PhaseAnalysis = {
  phase: SplitPhase;
  turns: number;
  start: number;
  end: number;
  recognitionMs: number | null;
  executionMs: number;
  tps: number | null;
};

export type SolvePause = {
  moveIndex: number;
  gapMs: number;
  phase: SplitPhase;
};

export type SolveAnalysis = {
  totalTurns: number;
  totalMs: number;
  tps: number | null;
  phases: PhaseAnalysis[];
  recognitionMs: number;
  pauses: SolvePause[];
};

export type AnalysisInput = {
  moves: readonly string[];
  moveTimes: readonly number[];
  phaseSplits: readonly SolvePhaseSplit[];
};

const PHASE_ORDER: SplitPhase[] = ["Cross", "F2L", "OLL", "PLL"];
export const MIN_PAUSE_MS = 400;
export const MAX_PAUSES = 5;

function boundaryIndex(times: readonly number[], markedAtMs: number) {
  if (markedAtMs <= 0) return 0;
  let count = 0;
  for (const at of times) {
    if (at <= markedAtMs) count += 1;
    else break;
  }
  return count;
}

export function analyzeSolve({ moves, moveTimes, phaseSplits }: AnalysisInput): SolveAnalysis | null {
  if (!moves.length || moves.length !== moveTimes.length) return null;
  const splits = new Map(phaseSplits.map(split => [split.phase, split]));
  const total = moveTimes[moveTimes.length - 1] ?? 0;

  const bounds: number[] = [0];
  for (const phase of PHASE_ORDER) {
    const split = splits.get(phase);
    const end =
      phase === "PLL" || !split
        ? phase === "PLL"
          ? moves.length
          : bounds[bounds.length - 1]
        : boundaryIndex(moveTimes, split.markedAtMs);
    bounds.push(Math.max(end, bounds[bounds.length - 1]));
  }

  const phases: PhaseAnalysis[] = [];
  let recognitionMs = 0;
  let previousMark = 0;
  PHASE_ORDER.forEach((phase, index) => {
    const start = bounds[index];
    const end = bounds[index + 1];
    const split = splits.get(phase);
    const markedAt = phase === "PLL" ? total : split?.markedAtMs ?? previousMark;
    const slice = merge(moves, moveTimes, start, end);
    if (start === end) {
      phases.push({
        phase,
        turns: 0,
        start,
        end,
        recognitionMs: null,
        executionMs: 0,
        tps: null,
      });
      previousMark = Math.max(previousMark, markedAt);
      return;
    }
    const firstAt = moveTimes[start];
    const recognition = index === 0 ? null : Math.max(0, firstAt - previousMark);
    const execution = Math.max(0, markedAt - firstAt);
    if (recognition !== null) recognitionMs += recognition;
    phases.push({
      phase,
      turns: slice.length,
      start,
      end,
      recognitionMs: recognition,
      executionMs: execution,
      tps: execution > 0 && slice.length > 1 ? (slice.length - 1) / (execution / 1000) : null,
    });
    previousMark = Math.max(previousMark, markedAt);
  });

  const pauses: SolvePause[] = [];
  for (let index = 1; index < moves.length; index += 1) {
    const gap = moveTimes[index] - moveTimes[index - 1];
    if (gap < MIN_PAUSE_MS) continue;
    const phase =
      phases.find(item => index >= item.start && index < item.end)?.phase ?? "PLL";
    pauses.push({ moveIndex: index, gapMs: gap, phase });
  }
  pauses.sort((left, right) => right.gapMs - left.gapMs);

  const totalTurns = merge(moves, moveTimes, 0, moves.length).length;
  return {
    totalTurns,
    totalMs: total,
    tps: total > 0 && totalTurns > 1 ? (totalTurns - 1) / (total / 1000) : null,
    phases,
    recognitionMs,
    pauses: pauses.slice(0, MAX_PAUSES),
  };
}

function merge(moves: readonly string[], times: readonly number[], start: number, end: number) {
  return mergeTurns(moves.slice(start, end), times.slice(start, end));
}

export type LastLayerCase = { id: string; name: string; state: string; algorithm?: string };

export type IdentifiedCase = {
  id: string;
  name: string;
  auf: number;
};

export function stateAfter(scramble: string, moves: readonly string[], count: number) {
  return applyFastMoves(stateFromScramble(scramble), moves.slice(0, count).join(" "));
}

const U_FACE = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const SIDE_TOPS = [9, 10, 11, 18, 19, 20, 36, 37, 38, 45, 46, 47];
const ORIENTATION_STICKERS = [...U_FACE, ...SIDE_TOPS];

const orientationMask = (state: string) =>
  ORIENTATION_STICKERS.map(index => (state[index] === "U" ? "1" : "0")).join("");

const rotateU = (state: string, quarters: number) =>
  quarters === 0 ? state : applyFastMoves(state, quarters === 3 ? "U'" : quarters === 2 ? "U2" : "U");

export function isOrientedLastLayer(state: string) {
  return U_FACE.every(index => state[index] === "U");
}

export function identifyOll(
  state: string,
  cases: readonly LastLayerCase[]
): IdentifiedCase | "skip" | null {
  if (state.length !== 54) return null;
  if (isOrientedLastLayer(state)) return "skip";
  const rotated = [0, 1, 2, 3].map(quarters => rotateU(state, quarters));
  const masks = rotated.map(orientationMask);
  let fallback: IdentifiedCase | null = null;
  for (const item of cases) {
    const target = orientationMask(item.state);
    const quarters = masks.indexOf(target);
    if (quarters < 0) continue;
    const candidate = { id: item.id, name: item.name, auf: quarters };
    if (!item.algorithm) return candidate;
    if (isOrientedLastLayer(applyFastMoves(rotated[quarters], item.algorithm))) return candidate;
    fallback ??= candidate;
  }
  return fallback;
}

export function identifyPll(
  state: string,
  cases: readonly LastLayerCase[]
): IdentifiedCase | "skip" | null {
  if (state.length !== 54) return null;
  for (let quarters = 0; quarters < 4; quarters += 1)
    if (rotateU(state, quarters) === SOLVED_FAST_STATE) return "skip";
  const table = new Map<string, LastLayerCase>();
  for (const item of cases)
    for (let quarters = 0; quarters < 4; quarters += 1) {
      const key = rotateU(item.state, quarters);
      if (!table.has(key)) table.set(key, item);
    }
  for (let quarters = 0; quarters < 4; quarters += 1) {
    const hit = table.get(rotateU(state, quarters));
    if (hit) return { id: hit.id, name: hit.name, auf: quarters };
  }
  return null;
}

export type SolveCases = {
  oll: IdentifiedCase | "skip" | null;
  pll: IdentifiedCase | "skip" | null;
};

export function identifySolveCases(
  scramble: string,
  moves: readonly string[],
  analysis: SolveAnalysis,
  catalog: { oll: readonly LastLayerCase[]; pll: readonly LastLayerCase[] }
): SolveCases {
  const f2l = analysis.phases.find(item => item.phase === "F2L");
  const oll = analysis.phases.find(item => item.phase === "OLL");
  const pll = analysis.phases.find(item => item.phase === "PLL");
  if (!f2l || !oll || !pll) return { oll: null, pll: null };
  try {
    return {
      oll: identifyOll(stateAfter(scramble, moves, f2l.end), catalog.oll),
      pll: identifyPll(stateAfter(scramble, moves, oll.end), catalog.pll),
    };
  } catch {
    return { oll: null, pll: null };
  }
}
