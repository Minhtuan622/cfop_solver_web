export type SolvePenalty = "none" | "+2" | "DNF";
export type SolveHistoryEntry = {
  id: string;
  createdAt: number;
  elapsedMs: number;
  input: string;
  inputKind: "scramble" | "state";
  moves: number;
  penalty: SolvePenalty;
  solution: string;
  note: string;
  tags: string[];
};

const KEY = "cfop-solve-history-v1";
const MAX_ENTRIES = 500;
type Imported = Partial<SolveHistoryEntry> & Record<string, unknown>;

function safePenalty(value: unknown): SolvePenalty { return value === "+2" || value === "DNF" ? value : "none"; }
function safeTags(value: unknown): string[] { return Array.isArray(value) ? Array.from(new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))).slice(0, 12) : []; }
function normalize(item: Imported): SolveHistoryEntry {
  return {
    id: typeof item.id === "string" && item.id ? item.id : crypto.randomUUID(),
    createdAt: typeof item.createdAt === "number" && Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
    elapsedMs: typeof item.elapsedMs === "number" && Number.isFinite(item.elapsedMs) && item.elapsedMs >= 0 ? Math.round(item.elapsedMs) : 0,
    input: typeof item.input === "string" ? item.input : "",
    inputKind: item.inputKind === "state" ? "state" : "scramble",
    moves: typeof item.moves === "number" && Number.isFinite(item.moves) ? Math.max(0, Math.round(item.moves)) : 0,
    penalty: safePenalty(item.penalty),
    solution: typeof item.solution === "string" ? item.solution : "",
    note: typeof item.note === "string" ? item.note.slice(0, 500) : "",
    tags: safeTags(item.tags),
  };
}
function write(entries: SolveHistoryEntry[]) { localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES))); }

export function readSolveHistory(): SolveHistoryEntry[] {
  try { return (JSON.parse(localStorage.getItem(KEY) ?? "[]") as Imported[]).filter((item) => item && typeof item === "object").map(normalize); } catch { return []; }
}
export function addSolveHistory(entry: Omit<SolveHistoryEntry, "id" | "createdAt" | "penalty" | "solution" | "note" | "tags"> & Partial<Pick<SolveHistoryEntry, "penalty" | "solution" | "note" | "tags">>): SolveHistoryEntry {
  const item = normalize({ ...entry, id: crypto.randomUUID(), createdAt: Date.now() }); write([item, ...readSolveHistory()]); return item;
}
export function updateSolveHistory(id: string, patch: Partial<Pick<SolveHistoryEntry, "elapsedMs" | "input" | "moves" | "penalty" | "solution" | "note" | "tags">>): SolveHistoryEntry[] { const next = readSolveHistory().map((entry) => entry.id === id ? normalize({ ...entry, ...patch }) : entry); write(next); return next; }
export function deleteSolveHistory(id: string): SolveHistoryEntry[] { const next = readSolveHistory().filter((entry) => entry.id !== id); write(next); return next; }
export function clearSolveHistory() { localStorage.removeItem(KEY); }
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
export function formatSolveResult(entry: SolveHistoryEntry) { const time = effectiveTime(entry); return time === null ? "DNF" : `${formatSolveTime(time)}${entry.penalty === "+2" ? "+" : ""}`; }
