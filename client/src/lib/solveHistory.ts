export type SolvePenalty = "none" | "+2" | "DNF";
import { notifyCfopCloudStateChanged } from "./cloudSyncSignal";
import { formatMultiBlindTime, multiBlindResult, type MultiBlindAttempt } from "./multiBlind";
import { normalizeTimerEventId, type TimerEventId } from "./timerEvents";

export const SPLIT_PHASES = ["Cross", "F2L", "OLL", "PLL"] as const;
export type SplitPhase = (typeof SPLIT_PHASES)[number];
export type SolvePhaseSplit = { phase: SplitPhase; markedAtMs: number; elapsedMs: number };
export type SolveHistoryEntry = {
  id: string;
  createdAt: number;
  elapsedMs: number;
  inspectionMs: number;
  input: string;
  inputKind: "scramble" | "state";
  moves: number;
  penalty: SolvePenalty;
  solution: string;
  note: string;
  tags: string[];
  phaseSplits: SolvePhaseSplit[];
  /** Older entries omit this field and are normalized as 3×3 when read. */
  eventId?: TimerEventId;
  /** Present only for 3×3 Multi-Blind results. */
  multiBlind?: MultiBlindAttempt;
  /** One independent 3×3 scramble for each Multi-Blind cube. */
  multiBlindScrambles?: string[];
};

const KEY = "cfop-solve-history-v1";
const MAX_ENTRIES = 500;
type Imported = Partial<SolveHistoryEntry> & Record<string, unknown>;

function safePenalty(value: unknown): SolvePenalty { return value === "+2" || value === "DNF" ? value : "none"; }
function safeTags(value: unknown): string[] { return Array.isArray(value) ? Array.from(new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))).slice(0, 12) : []; }
function safeMultiBlind(value: unknown): MultiBlindAttempt | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Partial<MultiBlindAttempt>;
  const attempted = candidate.attempted;
  const solved = candidate.solved;
  if (typeof attempted !== "number" || typeof solved !== "number" || !Number.isInteger(attempted) || !Number.isInteger(solved) || attempted < 2 || solved < 0 || solved > attempted) return undefined;
  return { attempted, solved };
}
function safeMultiBlindScrambles(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const scrambles = value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 99);
  return scrambles.length ? scrambles : undefined;
}
function safePhaseSplits(value: unknown): SolvePhaseSplit[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<SplitPhase>();
  const splits: SolvePhaseSplit[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const split = item as Partial<SolvePhaseSplit>;
    if (!SPLIT_PHASES.includes(split.phase as SplitPhase) || seen.has(split.phase as SplitPhase)) continue;
    if (typeof split.markedAtMs !== "number" || !Number.isFinite(split.markedAtMs) || split.markedAtMs < 0) continue;
    if (typeof split.elapsedMs !== "number" || !Number.isFinite(split.elapsedMs) || split.elapsedMs < 0) continue;
    const previous = splits.at(-1)?.markedAtMs ?? 0;
    if (split.markedAtMs < previous) continue;
    seen.add(split.phase as SplitPhase);
    splits.push({ phase: split.phase as SplitPhase, markedAtMs: Math.round(split.markedAtMs), elapsedMs: Math.round(split.elapsedMs) });
  }
  return splits.slice(0, SPLIT_PHASES.length);
}
function normalize(item: Imported): SolveHistoryEntry {
  return {
    id: typeof item.id === "string" && item.id ? item.id : crypto.randomUUID(),
    createdAt: typeof item.createdAt === "number" && Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
    elapsedMs: typeof item.elapsedMs === "number" && Number.isFinite(item.elapsedMs) && item.elapsedMs >= 0 ? Math.round(item.elapsedMs) : 0,
    inspectionMs: typeof item.inspectionMs === "number" && Number.isFinite(item.inspectionMs) && item.inspectionMs >= 0 ? Math.round(item.inspectionMs) : 0,
    input: typeof item.input === "string" ? item.input : "",
    inputKind: item.inputKind === "state" ? "state" : "scramble",
    moves: typeof item.moves === "number" && Number.isFinite(item.moves) ? Math.max(0, Math.round(item.moves)) : 0,
    penalty: safePenalty(item.penalty),
    solution: typeof item.solution === "string" ? item.solution : "",
    note: typeof item.note === "string" ? item.note.slice(0, 500) : "",
    tags: safeTags(item.tags),
    phaseSplits: safePhaseSplits(item.phaseSplits),
    eventId: normalizeTimerEventId(item.eventId),
    multiBlind: safeMultiBlind(item.multiBlind),
    multiBlindScrambles: safeMultiBlindScrambles(item.multiBlindScrambles),
  };
}
function write(entries: SolveHistoryEntry[]) { localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES))); notifyCfopCloudStateChanged(); }

export function readSolveHistory(): SolveHistoryEntry[] {
  try { return (JSON.parse(localStorage.getItem(KEY) ?? "[]") as Imported[]).filter((item) => item && typeof item === "object").map(normalize); } catch { return []; }
}
export function addSolveHistory(entry: Omit<SolveHistoryEntry, "id" | "createdAt" | "penalty" | "solution" | "note" | "tags" | "phaseSplits"> & Partial<Pick<SolveHistoryEntry, "penalty" | "solution" | "note" | "tags" | "phaseSplits">>): SolveHistoryEntry {
  const item = normalize({ ...entry, id: crypto.randomUUID(), createdAt: Date.now() }); write([item, ...readSolveHistory()]); return item;
}
export function updateSolveHistory(id: string, patch: Partial<Pick<SolveHistoryEntry, "elapsedMs" | "inspectionMs" | "input" | "moves" | "penalty" | "solution" | "note" | "tags" | "phaseSplits" | "multiBlind" | "multiBlindScrambles">>): SolveHistoryEntry[] { const next = readSolveHistory().map((entry) => entry.id === id ? normalize({ ...entry, ...patch }) : entry); write(next); return next; }
export function deleteSolveHistory(id: string): SolveHistoryEntry[] { const next = readSolveHistory().filter((entry) => entry.id !== id); write(next); return next; }
export function deleteSolveHistoryMany(ids: Iterable<string>): SolveHistoryEntry[] { const selected = new Set(ids); const next = readSolveHistory().filter((entry) => !selected.has(entry.id)); write(next); return next; }
export function clearSolveHistory() { localStorage.removeItem(KEY); notifyCfopCloudStateChanged(); }
export function importSolveHistory(payload: unknown): SolveHistoryEntry[] {
  const raw = Array.isArray(payload) ? payload : payload && typeof payload === "object" && Array.isArray((payload as { entries?: unknown }).entries) ? (payload as { entries: unknown[] }).entries : null;
  if (!raw) throw new Error("Invalid backup");
  const seen = new Set<string>();
  const entries = raw.filter((item): item is Imported => Boolean(item) && typeof item === "object").map(normalize).filter((item) => { if (seen.has(item.id)) return false; seen.add(item.id); return true; }).sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_ENTRIES);
  write(entries); return entries;
}
export function exportSolveHistory() { return { schema: "cfop-solver-timer-history", version: 2, exportedAt: new Date().toISOString(), entries: readSolveHistory() }; }
export function effectiveTime(entry: SolveHistoryEntry): number | null { return entry.penalty === "DNF" ? null : entry.elapsedMs + (entry.penalty === "+2" ? 2000 : 0); }
export function formatSolveTime(ms: number) { const total = ms / 1000; return `${Math.floor(total / 60).toString().padStart(2, "0")}:${Math.floor(total % 60).toString().padStart(2, "0")}.${Math.floor((total % 1) * 100).toString().padStart(2, "0")}`; }
export function formatSolveResult(entry: SolveHistoryEntry) {
  const time = effectiveTime(entry);
  if (entry.multiBlind) {
    const result = multiBlindResult(entry.multiBlind, entry.elapsedMs);
    const summary = `${result.solved}/${result.attempted} · ${result.score}đ · ${formatMultiBlindTime(entry.elapsedMs)}`;
    return time === null || !result.valid ? `DNF · ${summary}` : summary;
  }
  return time === null ? "DNF" : `${formatSolveTime(time)}${entry.penalty === "+2" ? "+" : ""}`;
}
