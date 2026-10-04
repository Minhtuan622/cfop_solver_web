import { rollingAverage } from "./timerRecords";
import { effectiveTime, SolveHistoryEntry } from "./solveHistory";

export type ProfileProgressPoint = { day: string; timestamp: number; best: number | null; ao5: number | null };
export type ProfileProgressRange = "7d" | "30d" | "all";

function dayStart(timestamp: number) { const date = new Date(timestamp); return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(); }

export function profileProgressByDay(entries: SolveHistoryEntry[]): ProfileProgressPoint[] {
  const ordered = [...entries].sort((left, right) => left.createdAt - right.createdAt);
  const running: SolveHistoryEntry[] = [];
  const points = new Map<string, ProfileProgressPoint>();
  for (const entry of ordered) {
    running.push(entry);
    const valid = running.map(effectiveTime).filter((value): value is number => value !== null);
    const timestamp = dayStart(entry.createdAt);
    const day = new Date(timestamp).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    points.set(String(timestamp), { day, timestamp, best: valid.length ? Math.min(...valid) : null, ao5: running.length >= 5 ? rollingAverage(running.slice(-5)) : null });
  }
  return Array.from(points.values());
}

export function filterProfileProgress(points: ProfileProgressPoint[], range: ProfileProgressRange, now = Date.now()) {
  if (range === "all") return points;
  const days = range === "7d" ? 7 : 30;
  return points.filter((point) => point.timestamp >= dayStart(now) - (days - 1) * 86_400_000);
}

export function meetsAo5Goal(ao5: number | null, goalMs: number | null | undefined) { return ao5 !== null && Boolean(goalMs) && ao5 <= (goalMs ?? 0); }
