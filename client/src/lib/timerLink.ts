import { isTimerEventId, type TimerEventId } from "@/lib/timerEvents";

export const MAX_TIMER_LINK_SCRAMBLE = 600;
const SAFE_SCRAMBLE = /^[A-Za-z0-9'+\-(),/{}\s]+$/;

export type TimerLink = { eventId: TimerEventId; scramble: string };

export function buildTimerPath(eventId: TimerEventId, scramble: string) {
  const params = new URLSearchParams({ event: eventId, scramble: scramble.replace(/\s+/g, " ").trim() });
  return `/timer?${params.toString()}`;
}

export function parseTimerLink(search: string): TimerLink | null {
  const params = new URLSearchParams(search);
  const eventId = params.get("event");
  const raw = params.get("scramble");
  if (!isTimerEventId(eventId) || raw === null) return null;
  const scramble = raw.replace(/\s+/g, " ").trim();
  if (!scramble || scramble.length > MAX_TIMER_LINK_SCRAMBLE || !SAFE_SCRAMBLE.test(scramble)) return null;
  return { eventId, scramble };
}
