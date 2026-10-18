import { DEFAULT_TIMER_EVENT, TIMER_EVENTS, isTimerEventId, timerEventLabel, type TimerEventId } from "@shared/timerEvents";
import { randomThreeByThreeScramble } from "./cubeScramble";

export { DEFAULT_TIMER_EVENT, TIMER_EVENTS, isTimerEventId, timerEventLabel };
export type { TimerEventId };

const THREE_BY_THREE_EVENTS = new Set<TimerEventId>(["333", "333oh", "333bf", "333fm", "333mbf"]);
type PreviewPuzzleId = "2x2x2" | "4x4x4" | "5x5x5" | "6x6x6" | "7x7x7" | "pyraminx" | "skewb" | "megaminx" | "fto" | "square1" | "clock";
const EVENT_PREVIEW_PUZZLES: Partial<Record<TimerEventId, PreviewPuzzleId>> = {
  "222": "2x2x2", "444": "4x4x4", "444bf": "4x4x4", "555": "5x5x5", "555bf": "5x5x5", "666": "6x6x6", "777": "7x7x7",
  pyram: "pyraminx", skewb: "skewb", minx: "megaminx", fto: "fto", sq1: "square1", clock: "clock",
};

/** Missing event metadata belongs to legacy 3×3 Timer history. */
export function normalizeTimerEventId(value: unknown): TimerEventId {
  return isTimerEventId(value) ? value : DEFAULT_TIMER_EVENT;
}

export function isThreeByThreeEvent(eventId: TimerEventId) {
  return THREE_BY_THREE_EVENTS.has(eventId);
}

export function timerPreviewPuzzleId(eventId: TimerEventId): PreviewPuzzleId | null {
  return EVENT_PREVIEW_PUZZLES[eventId] ?? null;
}

export function filterTimerEventEntries<T extends { eventId?: unknown }>(entries: readonly T[], eventId: TimerEventId) {
  return entries.filter((entry) => normalizeTimerEventId(entry.eventId) === eventId);
}

function randomMoveScramble(length: number, moves: readonly string[]) {
  const suffixes = ["", "2", "'"];
  const result: string[] = [];
  while (result.length < length) {
    const move = moves[Math.floor(Math.random() * moves.length)] ?? moves[0];
    if (result.at(-1)?.[0] === move[0]) continue;
    result.push(`${move}${suffixes[Math.floor(Math.random() * suffixes.length)]}`);
  }
  return result.join(" ");
}

/** Local, dependency-free backup notation used when the cubing worker cannot boot. */
export function fallbackTimerScramble(eventId: TimerEventId) {
  if (eventId === "222") return randomThreeByThreeScramble(11);
  if (isThreeByThreeEvent(eventId)) return randomThreeByThreeScramble();
  if (eventId === "444" || eventId === "444bf") return randomMoveScramble(40, ["U", "R", "F", "D", "L", "B", "Uw", "Rw", "Fw", "Dw", "Lw", "Bw"]);
  if (eventId === "555" || eventId === "555bf") return randomMoveScramble(60, ["U", "R", "F", "D", "L", "B", "Uw", "Rw", "Fw", "Dw", "Lw", "Bw", "3Uw", "3Rw", "3Fw", "3Dw", "3Lw", "3Bw"]);
  if (eventId === "666") return randomMoveScramble(80, ["U", "R", "F", "D", "L", "B", "Uw", "Rw", "Fw", "Dw", "Lw", "Bw", "3Uw", "3Rw", "3Fw", "3Dw", "3Lw", "3Bw"]);
  if (eventId === "777") return randomMoveScramble(100, ["U", "R", "F", "D", "L", "B", "Uw", "Rw", "Fw", "Dw", "Lw", "Bw", "3Uw", "3Rw", "3Fw", "3Dw", "3Lw", "3Bw"]);
  if (eventId === "pyram") return randomMoveScramble(11, ["R", "L", "U", "B", "r", "l", "u", "b"]);
  if (eventId === "skewb") return randomMoveScramble(9, ["R", "U", "L", "B"]);
  if (eventId === "minx") return Array.from({ length: 35 }, (_, index) => index % 2 ? "D++" : "R++").join(" ");
  if (eventId === "fto") return randomMoveScramble(30, ["U", "R", "F", "D", "L", "B"]);
  if (eventId === "sq1") return Array.from({ length: 12 }, (_, index) => index % 2 ? "(0, 1)" : "(1, 0)").join(" /");
  return "UR3+ DR3+ UL2- DL2- U3+ R2+ D1- L3- ALL5+ y2";
}

/** cubing.js generates random-state scrambles in a worker for official WCA event codes. */
export async function generateTimerScramble(eventId: TimerEventId) {
  try {
    const { randomScrambleForEvent } = await import("cubing/scramble");
    return (await randomScrambleForEvent(eventId)).toString();
  } catch (error) {
    // Some production browsers block the cubing.js worker/module boot. Keep the
    // timer usable for every event instead of clearing the active scramble.
    return fallbackTimerScramble(eventId);
  }
}
