export const TIMER_EVENTS = [
  { id: "222", labelVi: "2×2×2", labelEn: "2×2×2" },
  { id: "333", labelVi: "3×3×3", labelEn: "3×3×3" },
  { id: "333oh", labelVi: "3×3 OH", labelEn: "3×3 OH" },
  { id: "333bf", labelVi: "3×3 BLD", labelEn: "3×3 BLD" },
  { id: "333fm", labelVi: "3×3 FMC", labelEn: "3×3 FMC" },
  { id: "333mbf", labelVi: "3×3 MBLD", labelEn: "3×3 MBLD" },
  { id: "444", labelVi: "4×4×4", labelEn: "4×4×4" },
  { id: "444bf", labelVi: "4×4 BLD", labelEn: "4×4 BLD" },
  { id: "555", labelVi: "5×5×5", labelEn: "5×5×5" },
  { id: "555bf", labelVi: "5×5 BLD", labelEn: "5×5 BLD" },
  { id: "666", labelVi: "6×6×6", labelEn: "6×6×6" },
  { id: "777", labelVi: "7×7×7", labelEn: "7×7×7" },
  { id: "pyram", labelVi: "Pyraminx", labelEn: "Pyraminx" },
  { id: "skewb", labelVi: "Skewb", labelEn: "Skewb" },
  { id: "minx", labelVi: "Megaminx", labelEn: "Megaminx" },
  { id: "sq1", labelVi: "Square-1", labelEn: "Square-1" },
  { id: "clock", labelVi: "Clock", labelEn: "Clock" },
] as const;

export type TimerEventId = (typeof TIMER_EVENTS)[number]["id"];
export const DEFAULT_TIMER_EVENT: TimerEventId = "333";

export function isTimerEventId(value: unknown): value is TimerEventId {
  return typeof value === "string" && TIMER_EVENTS.some((event) => event.id === value);
}

/** Missing event metadata belongs to legacy 3×3 Timer history. */
export function normalizeTimerEventId(value: unknown): TimerEventId {
  return isTimerEventId(value) ? value : DEFAULT_TIMER_EVENT;
}

export function timerEventLabel(eventId: TimerEventId, language: "vi" | "en") {
  const event = TIMER_EVENTS.find((item) => item.id === eventId) ?? TIMER_EVENTS[1];
  return language === "vi" ? event.labelVi : event.labelEn;
}

export function isThreeByThreeEvent(eventId: TimerEventId) {
  return eventId === DEFAULT_TIMER_EVENT || eventId === "333oh" || eventId === "333bf" || eventId === "333fm" || eventId === "333mbf";
}

export function timerPreviewPuzzleId(eventId: TimerEventId): "2x2x2" | "4x4x4" | "5x5x5" | "6x6x6" | "7x7x7" | "pyraminx" | "skewb" | "megaminx" | "square1" | "clock" | null {
  if (eventId === "222") return "2x2x2";
  if (eventId === "444" || eventId === "444bf") return "4x4x4";
  if (eventId === "555" || eventId === "555bf") return "5x5x5";
  if (eventId === "666") return "6x6x6";
  if (eventId === "777") return "7x7x7";
  if (eventId === "pyram") return "pyraminx";
  if (eventId === "skewb") return "skewb";
  if (eventId === "minx") return "megaminx";
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
