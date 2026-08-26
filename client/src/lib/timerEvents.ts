import { DEFAULT_TIMER_EVENT, TIMER_EVENTS, isTimerEventId, timerEventLabel, type TimerEventId } from "@shared/timerEvents";

export { DEFAULT_TIMER_EVENT, TIMER_EVENTS, isTimerEventId, timerEventLabel };
export type { TimerEventId };

/** Missing event metadata belongs to legacy 3×3 Timer history. */
export function normalizeTimerEventId(value: unknown): TimerEventId {
  return isTimerEventId(value) ? value : DEFAULT_TIMER_EVENT;
}

export function isThreeByThreeEvent(eventId: TimerEventId) {
  return eventId === DEFAULT_TIMER_EVENT || eventId === "333oh" || eventId === "333bf" || eventId === "333fm" || eventId === "333mbf";
}

export function timerPreviewPuzzleId(eventId: TimerEventId): "2x2x2" | "4x4x4" | "5x5x5" | "6x6x6" | "7x7x7" | "pyraminx" | "skewb" | "megaminx" | "fto" | "square1" | "clock" | null {
  if (eventId === "222") return "2x2x2";
  if (eventId === "444" || eventId === "444bf") return "4x4x4";
  if (eventId === "555" || eventId === "555bf") return "5x5x5";
  if (eventId === "666") return "6x6x6";
  if (eventId === "777") return "7x7x7";
  if (eventId === "pyram") return "pyraminx";
  if (eventId === "skewb") return "skewb";
  if (eventId === "minx") return "megaminx";
  if (eventId === "fto") return "fto";
  if (eventId === "sq1") return "square1";
  if (eventId === "clock") return "clock";
  return null;
}

export function filterTimerEventEntries<T extends { eventId?: unknown }>(entries: readonly T[], eventId: TimerEventId) {
  return entries.filter((entry) => normalizeTimerEventId(entry.eventId) === eventId);
}

/** cubing.js generates random-state scrambles in a worker for official WCA event codes. */
export async function generateTimerScramble(eventId: TimerEventId) {
  const { randomScrambleForEvent } = await import("cubing/scramble");
  return (await randomScrambleForEvent(eventId)).toString();
}
