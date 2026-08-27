import { DEFAULT_TIMER_EVENT, TIMER_EVENTS, isTimerEventId, timerEventLabel, type TimerEventId } from "@shared/timerEvents";

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

/** cubing.js generates random-state scrambles in a worker for official WCA event codes. */
export async function generateTimerScramble(eventId: TimerEventId) {
  const { randomScrambleForEvent } = await import("cubing/scramble");
  return (await randomScrambleForEvent(eventId)).toString();
}
