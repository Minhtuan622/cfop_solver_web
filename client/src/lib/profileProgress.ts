import { rollingAverage } from "./timerRecords";
import { effectiveTime, SolveHistoryEntry } from "./solveHistory";

export type ProfileProgressPoint = { day: string; best: number | null; ao5: number | null };

export function profileProgressByDay(entries: SolveHistoryEntry[]): ProfileProgressPoint[] {
  const ordered = [...entries].sort((left, right) => left.createdAt - right.createdAt);
  const running: SolveHistoryEntry[] = [];
  const points = new Map<string, ProfileProgressPoint>();
  for (const entry of ordered) {
    running.push(entry);
    const valid = running.map(effectiveTime).filter((value): value is number => value !== null);
    const day = new Date(entry.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    points.set(day, { day, best: valid.length ? Math.min(...valid) : null, ao5: running.length >= 5 ? rollingAverage(running.slice(-5)) : null });
  }
  return Array.from(points.values());
}
