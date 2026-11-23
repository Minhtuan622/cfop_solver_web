export type SolvePenalty = "none" | "+2" | "DNF";
export type SolveSource = "manual" | "bluetooth" | "smartcube";
import { z } from "zod";
import { readStoredJson, writeStoredValue } from "./browserStorage";
import { notifyCfopCloudStateChanged } from "./cloudSyncSignal";
import {
  parseCstimerExport,
  buildCstimerExport,
} from "./cstimer";
import { formatMultiBlindTime, multiBlindResult, type MultiBlindAttempt } from "./multiBlind";
import { normalizeTimerEventId, type TimerEventId } from "./timerEvents";
import { readSolverSettings } from "./appSettings";
import { orientForCross, scrambledState } from "./scrambleOrientation";

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
  /** Where the solve came from. Older entries omit this field (treated as manual). */
  source?: SolveSource;
  /** Present only for 3×3 Multi-Blind results. */
  multiBlind?: MultiBlindAttempt;
  /** One independent 3×3 scramble for each Multi-Blind cube. */
  multiBlindScrambles?: string[];
  /** Đánh dấu xóa mềm (tombstone): lần xóa của entry này. Entry có deletedAt
   *  được giữ lại để đồng bộ biết đã xóa, không bị khôi phục bởi bản từ xa cũ. */
  deletedAt?: number;
};

const KEY = "cfop-solve-history-v1";
const MAX_ENTRIES = 500;
/**
 * Số tombstone (lượt đã xoá) giữ lại tối đa, mới xoá trước. Tombstone được
 * gửi kèm khi đồng bộ cloud để máy khác cũng xoá theo; chúng không chiếm chỗ
 * của 500 lượt đang hiển thị.
 */
export const MAX_SOLVE_TOMBSTONES = 100;
/** Imports may exceed MAX_ENTRIES but never exceed this (localStorage safety). */
const IMPORT_LIMIT = 10_000;
type Imported = Partial<SolveHistoryEntry> & Record<string, unknown>;

const finiteNumber = () => z.number().finite();
const nonNegativeNumber = () => z.number().finite().min(0);
const tagsSchema = z
  .array(z.unknown())
  .transform(value => {
    const seen = new Set<string>();
    const tags: string[] = [];
    for (const item of value) {
      if (typeof item !== "string") continue;
      const tag = item.trim();
      if (!tag || seen.has(tag)) continue;
      seen.add(tag);
      tags.push(tag);
      if (tags.length >= 12) break;
    }
    return tags;
  })
  .catch(() => [] as string[]);

const phaseSplitSchema = z.object({
  phase: z.enum(SPLIT_PHASES),
  markedAtMs: nonNegativeNumber(),
  elapsedMs: nonNegativeNumber(),
});
const phaseSplitsSchema = z
  .array(z.unknown())
  .transform(items => {
    const seen = new Set<SplitPhase>();
    const splits: SolvePhaseSplit[] = [];
    for (const raw of items) {
      const parsed = phaseSplitSchema.safeParse(raw);
      if (!parsed.success) continue;
      const { phase, markedAtMs, elapsedMs } = parsed.data;
      if (seen.has(phase)) continue;
      const previous = splits.at(-1)?.markedAtMs ?? 0;
      if (markedAtMs < previous) continue;
      seen.add(phase);
      splits.push({
        phase,
        markedAtMs: Math.round(markedAtMs),
        elapsedMs: Math.round(elapsedMs),
      });
      if (splits.length >= SPLIT_PHASES.length) break;
    }
    return splits;
  })
  .catch(() => [] as SolvePhaseSplit[]);

const multiBlindSchema = z
  .object({
    attempted: finiteNumber().int().min(2),
    solved: finiteNumber().int().min(0),
  })
  .refine(value => value.solved <= value.attempted)
  .transform(value => ({ attempted: value.attempted, solved: value.solved }))
  .optional()
  .catch(() => undefined);

const multiBlindScramblesSchema = z
  .array(z.unknown())
  .transform(items =>
    items
      .filter((item): item is string => typeof item === "string")
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .slice(0, 99),
  )
  .refine(scrambles => scrambles.length > 0)
  .optional()
  .catch(() => undefined);

const solveHistoryEntrySchema = z.object({
  id: z.string().min(1).catch(() => crypto.randomUUID()),
  createdAt: finiteNumber().catch(() => Date.now()),
  elapsedMs: nonNegativeNumber().transform(value => Math.round(value)).catch(0),
  inspectionMs: nonNegativeNumber().transform(value => Math.round(value)).catch(0),
  input: z.string().catch(""),
  inputKind: z.enum(["scramble", "state"]).catch("scramble"),
  moves: nonNegativeNumber().transform(value => Math.round(value)).catch(0),
  penalty: z.enum(["none", "+2", "DNF"]).catch("none"),
  solution: z.string().catch(""),
  note: z.string().transform(value => value.slice(0, 500)).catch(""),
  tags: tagsSchema,
  phaseSplits: phaseSplitsSchema,
  eventId: z
    .unknown()
    .optional()
    .transform(value => normalizeTimerEventId(value)),
  source: z.enum(["manual", "bluetooth", "smartcube"]).optional().catch(undefined),
  multiBlind: multiBlindSchema,
  multiBlindScrambles: multiBlindScramblesSchema,
  deletedAt: finiteNumber().min(0).optional().catch(undefined),
});

function normalize(item: Imported): SolveHistoryEntry {
  const fallback: SolveHistoryEntry = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    elapsedMs: 0,
    inspectionMs: 0,
    input: "",
    inputKind: "scramble",
    moves: 0,
    penalty: "none",
    solution: "",
    note: "",
    tags: [],
    phaseSplits: [],
  };
  try {
    return solveHistoryEntrySchema.parse(item);
  } catch {
    // A malformed entry degrades to a blank placeholder instead of taking
    // down the whole history read.
    return fallback;
  }
}
/**
 * Ghi lịch sử: tối đa `limit` lượt đang hiển thị (giữ nguyên thứ tự), sau đó
 * là các tombstone mới xoá nhất (tối đa `MAX_SOLVE_TOMBSTONES`).
 */
function write(entries: SolveHistoryEntry[], limit = MAX_ENTRIES) {
  const live = entries.filter((entry) => !entry.deletedAt).slice(0, limit);
  const tombstones = entries
    .filter((entry) => entry.deletedAt)
    .sort((left, right) => (right.deletedAt ?? 0) - (left.deletedAt ?? 0))
    .slice(0, MAX_SOLVE_TOMBSTONES);
  writeStoredValue(KEY, JSON.stringify([...live, ...tombstones]));
  notifyCfopCloudStateChanged();
}

/** Mọi lượt đã lưu, kể cả tombstone (dùng cho đồng bộ và các lần ghi). */
export function readStoredSolveHistory(): SolveHistoryEntry[] {
  return readStoredJson<Imported[]>(KEY, [])
    .filter((item): item is Imported =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
    )
    .map(normalize);
}

/** Các lượt đang hiển thị (bỏ tombstone). */
export function readSolveHistory(): SolveHistoryEntry[] {
  return readStoredSolveHistory().filter((entry) => !entry.deletedAt);
}
const liveEntries = (entries: SolveHistoryEntry[]) =>
  entries.filter((entry) => !entry.deletedAt);
export function addSolveHistory(entry: Omit<SolveHistoryEntry, "id" | "createdAt" | "penalty" | "solution" | "note" | "tags" | "phaseSplits"> & Partial<Pick<SolveHistoryEntry, "penalty" | "solution" | "note" | "tags" | "phaseSplits">>): SolveHistoryEntry {
  const item = normalize({ ...entry, id: crypto.randomUUID(), createdAt: Date.now() }); write([item, ...readStoredSolveHistory()]); return item;
}
export function updateSolveHistory(id: string, patch: Partial<Pick<SolveHistoryEntry, "elapsedMs" | "inspectionMs" | "input" | "moves" | "penalty" | "solution" | "note" | "tags" | "phaseSplits" | "multiBlind" | "multiBlindScrambles">>): SolveHistoryEntry[] { const next = readStoredSolveHistory().map((entry) => entry.id === id && !entry.deletedAt ? normalize({ ...entry, ...patch }) : entry); write(next); return liveEntries(next); }
/**
 * Xoá mềm: ghi tombstone (`deletedAt`) vào bộ nhớ nhưng chỉ trả về các lượt
 * còn hiển thị, giống `readSolveHistory`, để màn hình bỏ ngay lượt vừa xoá.
 */
export function deleteSolveHistory(id: string): SolveHistoryEntry[] {
  return deleteSolveHistoryMany([id]);
}
export function deleteSolveHistoryMany(ids: Iterable<string>): SolveHistoryEntry[] {
  const selected = new Set(ids);
  const next = readStoredSolveHistory().map((entry) =>
    selected.has(entry.id) && !entry.deletedAt ? normalize({ ...entry, deletedAt: Date.now() }) : entry,
  );
  write(next);
  return liveEntries(next);
}
export function importSolveHistory(payload: unknown): SolveHistoryEntry[] {
  const raw = Array.isArray(payload) ? payload : payload && typeof payload === "object" && Array.isArray((payload as { entries?: unknown }).entries) ? (payload as { entries: unknown[] }).entries : null;
  if (!raw) throw new Error("Invalid backup");
  const seen = new Set<string>();
  const entries = raw.filter((item): item is Imported => Boolean(item) && typeof item === "object" && !Array.isArray(item)).map(normalize).filter((item) => { if (seen.has(item.id)) return false; seen.add(item.id); return true; }).sort((a, b) => b.createdAt - a.createdAt);
  write(entries); return liveEntries(entries).slice(0, MAX_ENTRIES);
}

export type CstimerImportSummary = {
  /** Sessions whose solves were imported. */
  sessions: number;
  /** Solves added to the history. */
  imported: number;
  /** Solves skipped because an identical one already exists. */
  duplicates: number;
  /** Sessions skipped because their scramble type is unknown. */
  skippedSessions: number;
  /** Malformed solves skipped. */
  invalidSolves: number;
  /** Solves dropped because the import hit the 10,000-entry safety bound. */
  truncated: number;
};

function cstimerEntryKey(entry: {
  createdAt: number;
  elapsedMs: number;
  penalty: SolvePenalty;
  input: string;
  eventId?: string | undefined;
}) {
  return `${entry.createdAt}|${entry.elapsedMs}|${entry.penalty}|${entry.input}|${normalizeTimerEventId(entry.eventId)}`;
}

/**
 * Merge a parsed csTimer export into the history. Solves identical to one
 * already stored (same time, penalty, scramble, date and event) are skipped,
 * so importing the same file twice never duplicates anything.
 */
export function importCstimerSolveHistory(
  payload: unknown,
): CstimerImportSummary {
  const parsed = parseCstimerExport(payload);
  const stored = readStoredSolveHistory();
  const existing = liveEntries(stored);
  const tombstones = stored.filter((entry) => entry.deletedAt);
  const seen = new Set(existing.map(cstimerEntryKey));

  const merged: SolveHistoryEntry[] = [];
  let duplicates = 0;
  for (const raw of parsed.entries) {
    const entry: SolveHistoryEntry = normalize({
      ...raw,
      id: crypto.randomUUID(),
      inputKind: "scramble" as const,
      moves: 0,
      solution: "",
      inspectionMs: 0,
      tags: ["csTimer"],
      phaseSplits: [],
      source: "manual",
    });
    const key = cstimerEntryKey(entry);
    if (seen.has(key)) {
      duplicates += 1;
      continue;
    }
    seen.add(key);
    merged.push(entry);
  }

  // Newest first, same convention as the rest of the history. csTimer
  // imports are exempt from the 500-solve cap (users migrate whole
  // histories); a much higher safety bound keeps localStorage healthy.
  const all = [...merged, ...existing].sort(
    (a, b) => b.createdAt - a.createdAt,
  );
  const truncated = Math.max(0, all.length - IMPORT_LIMIT);
  write([...all.slice(0, IMPORT_LIMIT), ...tombstones], IMPORT_LIMIT);
  return {
    sessions: parsed.sessions,
    imported: merged.length,
    duplicates,
    skippedSessions: parsed.skippedSessions,
    invalidSolves: parsed.invalidSolves,
    truncated,
  };
}

/** Rebuild a csTimer export file from the stored history. */
export function exportCstimerSolveHistory(): Record<string, unknown> {
  return buildCstimerExport(readSolveHistory());
}
export function exportSolveHistory() { return { schema: "cfop-solver-timer-history", version: 2, exportedAt: new Date().toISOString(), entries: readSolveHistory() }; }
export function effectiveTime(entry: SolveHistoryEntry): number | null { return entry.penalty === "DNF" ? null : entry.elapsedMs + (entry.penalty === "+2" ? 2000 : 0); }
/**
 * `mm:ss.cc`, cắt (không làm tròn lên) tới phần trăm giây như WCA. Tính trên
 * số phần trăm giây nguyên để 9870 ms ra "00:09.87" chứ không phải "00:09.86"
 * do sai số dấu phẩy động.
 */
export function formatSolveTime(ms: number) {
  const centis = Math.floor(Math.floor(ms + 1e-6) / 10);
  const minutes = Math.floor(centis / 6000);
  const seconds = Math.floor(centis / 100) % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${(centis % 100).toString().padStart(2, "0")}`;
}
/**
 * Formats a running timer readout.
 *
 * Unlike `formatSolveTime`, a negative duration is clamped to zero: the live
 * readout never shows a negative time, not even for the frame between a clock
 * adjustment and the next animation tick.
 */
export function formatTimerReadout(ms: number) { return formatSolveTime(Math.max(0, ms)); }
export function formatSolveResult(entry: SolveHistoryEntry) {
  const time = effectiveTime(entry);
  if (entry.multiBlind) {
    const result = multiBlindResult(entry.multiBlind, entry.elapsedMs);
    const summary = `${result.solved}/${result.attempted} · ${result.score}đ · ${formatMultiBlindTime(entry.elapsedMs)}`;
    return time === null || !result.valid ? `DNF · ${summary}` : summary;
  }
  return time === null ? "DNF" : `${formatSolveTime(time)}${entry.penalty === "+2" ? "+" : ""}`;
}

/**
 * Resolves the cube state a solve started from.
 *
 * A solve is stored either as a scramble or as a full state, so the state is
 * only replayed when the entry already carries one.
 */
/**
 * Khối lúc bắt đầu giải: tráo cầm trắng U, xanh lá F rồi lật màu cross trong
 * Cài đặt về D — lời giải người dùng nhập được viết theo hướng đang cầm này.
 */
export function initialStateFor(entry: SolveHistoryEntry) {
  return entry.inputKind === "state" && entry.input.length === 54
    ? entry.input
    : orientForCross(scrambledState(entry.input), readSolverSettings().crossColor);
}
