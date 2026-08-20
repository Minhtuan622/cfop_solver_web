export type SolveHistoryEntry = { id: string; createdAt: number; elapsedMs: number; input: string; inputKind: "scramble" | "state"; moves: number };
const KEY = "cfop-solve-history-v1";

export function readSolveHistory(): SolveHistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as SolveHistoryEntry[]; } catch { return []; }
}

export function addSolveHistory(entry: Omit<SolveHistoryEntry, "id" | "createdAt">): SolveHistoryEntry {
  const item = { ...entry, id: crypto.randomUUID(), createdAt: Date.now() };
  const next = [item, ...readSolveHistory()].slice(0, 100);
  localStorage.setItem(KEY, JSON.stringify(next));
  return item;
}

export function clearSolveHistory() { localStorage.removeItem(KEY); }

export function formatSolveTime(ms: number) {
  const total = ms / 1000;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${Math.floor(total % 60).toString().padStart(2, "0")}.${Math.floor((total % 1) * 100).toString().padStart(2, "0")}`;
}
