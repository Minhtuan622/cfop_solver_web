import { DEFAULT_TIMER_EVENT, TIMER_EVENTS, isTimerEventId, timerEventLabel, type TimerEventId } from "@shared/timerEvents";
import { fallbackScramble } from "./fallbackScrambles";
import { randomTwoByTwoScramble } from "./twoByTwoScramble";

export { DEFAULT_TIMER_EVENT, TIMER_EVENTS, isTimerEventId, timerEventLabel };
export type { TimerEventId };

const THREE_BY_THREE_EVENTS = new Set<TimerEventId>(["333", "333oh", "333bf", "333fm", "333mbf"]);
type PreviewPuzzleId = "2x2x2" | "3x3x3" | "4x4x4" | "5x5x5" | "6x6x6" | "7x7x7" | "pyraminx" | "skewb" | "megaminx" | "fto" | "square1" | "clock";
const EVENT_PREVIEW_PUZZLES: Partial<Record<TimerEventId, PreviewPuzzleId>> = {
  "222": "2x2x2", "333": "3x3x3", "333oh": "3x3x3", "333bf": "3x3x3", "333fm": "3x3x3", "333mbf": "3x3x3",
  "444": "4x4x4", "444bf": "4x4x4", "555": "5x5x5", "555bf": "5x5x5", "666": "6x6x6", "777": "7x7x7",
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

/**
 * Scramble dự phòng khi worker của cubing.js không khởi động được: đúng bộ
 * lượt, độ dài và định dạng WCA của từng event (xem `fallbackScrambles.ts`).
 */
export function fallbackTimerScramble(eventId: TimerEventId) {
  return eventId === "222" ? randomTwoByTwoScramble() : fallbackScramble(eventId);
}

/**
 * Event mà cubing.js cho kết quả khác định dạng TNoodle (WCA), nên tự sinh:
 * - 2×2: cubing.js dùng cả lượt L; TNoodle chỉ R, U, F (random-state).
 * - 6×6: cubing.js dùng 3Dw/3Lw/3Bw; TNoodle chỉ 3Uw/3Rw/3Fw.
 * - Clock: thứ tự chốt của WCA 2023 là UR DR DL UL U R D L ALL y2 U R D L ALL.
 */
const OWN_SCRAMBLERS: Partial<Record<TimerEventId, () => string>> = {
  "222": randomTwoByTwoScramble,
  "666": () => fallbackScramble("666"),
  clock: () => fallbackScramble("clock"),
};

/** cubing.js generates random-state scrambles in a worker for official WCA event codes. */
export async function generateTimerScramble(eventId: TimerEventId) {
  const own = OWN_SCRAMBLERS[eventId];
  if (own) return own();
  try {
    const { randomScrambleForEvent } = await import("cubing/scramble");
    return (await randomScrambleForEvent(eventId)).toString();
  } catch (error) {
    // Ghi lại để lỗi worker không bị nuốt âm thầm như trước.
    console.warn(`[scramble] cubing.js failed for ${eventId}; using fallback.`, error);
    // Some production browsers block the cubing.js worker/module boot. Keep the
    // timer usable for every event instead of clearing the active scramble.
    return fallbackTimerScramble(eventId);
  }
}
