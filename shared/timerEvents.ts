export const TIMER_EVENT_IDS = [
  "222", "333", "333oh", "333bf", "333fm", "333mbf",
  "444", "444bf", "555", "555bf", "666", "777",
  "pyram", "skewb", "minx", "sq1", "clock",
] as const;

export type TimerEventId = (typeof TIMER_EVENT_IDS)[number];
export const DEFAULT_TIMER_EVENT: TimerEventId = "333";

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
] as const satisfies readonly { id: TimerEventId; labelVi: string; labelEn: string }[];

export function isTimerEventId(value: unknown): value is TimerEventId {
  return typeof value === "string" && (TIMER_EVENT_IDS as readonly string[]).includes(value);
}

export function timerEventLabel(eventId: TimerEventId, language: "vi" | "en") {
  const event = TIMER_EVENTS.find((item) => item.id === eventId) ?? TIMER_EVENTS[1];
  return language === "vi" ? event.labelVi : event.labelEn;
}
