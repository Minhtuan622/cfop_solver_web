/**
 * Separate, standalone history for the keyboard-driven virtual cube.
 *
 * Deliberately NOT backed by solve-history storage or cloud sync: virtual
 * solves must never mix into a cuber's real 3×3×3 statistics.
 */
import { readStoredJson, writeStoredValue } from "@/lib/browserStorage";
import type { SolvePenalty, SolveHistoryEntry } from "@/lib/solveHistory";
import { rollingAverage } from "@/lib/timerRecords";

const KEY = "cfop-play-history-v1";
const MAX_ENTRIES = 500;

export type PlayHistoryEntry = {
  id: string;
  createdAt: number;
  elapsedMs: number;
  inspectionMs: number;
  penalty: SolvePenalty;
  scramble: string;
  /** Every move applied in order, including whole-cube rotations. */
  solution: string;
  moves: number;
};

export type PlayHistoryInput = Omit<PlayHistoryEntry, "id" | "createdAt">;

export function readPlayHistory(): PlayHistoryEntry[] {
  return readStoredJson<PlayHistoryEntry[]>(KEY, [])
    .filter(
      item =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof item.elapsedMs === "number" &&
        typeof item.scramble === "string",
    )
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_ENTRIES);
}

export function addPlayHistory(
  input: PlayHistoryInput,
): PlayHistoryEntry[] {
  const entry: PlayHistoryEntry = {
    ...input,
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `play-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: Date.now(),
  };
  const next = [entry, ...readPlayHistory()].slice(0, MAX_ENTRIES);
  writeStoredValue(KEY, JSON.stringify(next));
  return next;
}

export function deletePlayHistory(id: string): PlayHistoryEntry[] {
  const next = readPlayHistory().filter(entry => entry.id !== id);
  writeStoredValue(KEY, JSON.stringify(next));
  return next;
}

export function clearPlayHistory(): PlayHistoryEntry[] {
  writeStoredValue(KEY, "[]");
  return [];
}

/** Penalty-adjusted time; DNF yields null. */
export function playEffectiveTime(entry: PlayHistoryEntry): number | null {
  if (entry.penalty === "DNF") return null;
  return entry.elapsedMs + (entry.penalty === "+2" ? 2_000 : 0);
}

export type PlayStats = {
  count: number;
  validCount: number;
  bestMs: number | null;
  /** WCA trimmed average of the last 5 (best & worst dropped; DNF = worst). */
  ao5Ms: number | null;
};

export function playStats(entries: readonly PlayHistoryEntry[]): PlayStats {
  const valid = entries
    .map(playEffectiveTime)
    .filter((value): value is number => value !== null);
  const bestMs = valid.length ? Math.min(...valid) : null;
  const last5 = entries.slice(0, 5);
  // rollingAverage only reads penalty + elapsedMs via effectiveTime, so the
  // cast is safe and keeps the WCA trimming rule identical everywhere.
  const ao5 =
    last5.length === 5
      ? rollingAverage(last5 as unknown as SolveHistoryEntry[])
      : null;
  return {
    count: entries.length,
    validCount: valid.length,
    bestMs,
    ao5Ms: ao5 === null ? null : Math.round(ao5),
  };
}

/** mm:ss.cc — same readout style as the rest of the app's timer. */
export function formatPlayTime(ms: number) {
  const total = ms / 1000;
  return `${Math.floor(total / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(total % 60)
    .toString()
    .padStart(2, "0")}.${Math.floor((total % 1) * 100)
    .toString()
    .padStart(2, "0")}`;
}
