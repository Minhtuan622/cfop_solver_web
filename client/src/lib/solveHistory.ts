export type SolvePenalty = "none" | "+2" | "DNF";
export type SolveHistoryEntry = {
  id: string;
  createdAt: number;
  elapsedMs: number;
  input: string;
  inputKind: "scramble" | "state";
  moves: number;
  penalty: SolvePenalty;
};

const KEY = "cfop-solve-history-v1";

function normalize(item: Omit<SolveHistoryEntry, "penalty"> & { penalty?: SolvePenalty }): SolveHistoryEntry {
  return { ...item, penalty: item.penalty ?? "none" };
}
function write(entries: SolveHistoryEntry[]) { localStorage.setItem(KEY, JSON.stringify(entries.slice(0, 100))); }

export function readSolveHistory(): SolveHistoryEntry[] {
  try { return (JSON.parse(localStorage.getItem(KEY) ?? "[]") as Array<Omit<SolveHistoryEntry, "penalty"> & { penalty?: SolvePenalty }>).map(normalize); } catch { return []; }
}

export function addSolveHistory(entry: Omit<SolveHistoryEntry, "id" | "createdAt" | "penalty"> & { penalty?: SolvePenalty }): SolveHistoryEntry {
  const item = normalize({ ...entry, id: crypto.randomUUID(), createdAt: Date.now() });
  write([item, ...readSolveHistory()]);
  return item;
}

export function updateSolveHistory(id: string, patch: Partial<Pick<SolveHistoryEntry, "elapsedMs" | "input" | "moves" | "penalty">>): SolveHistoryEntry[] {
  const next = readSolveHistory().map((entry) => entry.id === id ? normalize({ ...entry, ...patch }) : entry);
  write(next); return next;
}

export function deleteSolveHistory(id: string): SolveHistoryEntry[] {
  const next = readSolveHistory().filter((entry) => entry.id !== id);
  write(next); return next;
}

export function clearSolveHistory() { localStorage.removeItem(KEY); }
export function effectiveTime(entry: SolveHistoryEntry): number | null { return entry.penalty === "DNF" ? null : entry.elapsedMs + (entry.penalty === "+2" ? 2000 : 0); }
export function formatSolveTime(ms: number) {
  const total = ms / 1000;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${Math.floor(total % 60).toString().padStart(2, "0")}.${Math.floor((total % 1) * 100).toString().padStart(2, "0")}`;
}
export function formatSolveResult(entry: SolveHistoryEntry) {
  const time = effectiveTime(entry);
  return time === null ? "DNF" : `${formatSolveTime(time)}${entry.penalty === "+2" ? "+" : ""}`;
}
