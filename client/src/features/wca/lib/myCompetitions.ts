import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../../server/routers";
import type { Language } from "@/lib/i18n";
import { formatWcaRecordValue } from "./wcaRecords";

type AccountWcaOutput = inferRouterOutputs<AppRouter>["cfopAccount"]["wca"];

export type MyCompetitions = NonNullable<AccountWcaOutput["myCompetitions"]>;
export type MyCompetition = MyCompetitions["upcoming"][number];
export type MyCompetitionDetail = AccountWcaOutput["competitionDetail"];
export type ScheduleItem = MyCompetitionDetail["schedule"][number];
export type ResultRow = MyCompetitionDetail["results"][number];
export type CompetitionInfo = MyCompetition["competition"];

const localeOf = (language: Language) => (language === "vi" ? "vi-VN" : "en-US");

export type RegistrationState = "notYet" | "open" | "closed" | "unknown";

export function registrationState(
  info: Pick<CompetitionInfo, "registrationOpen" | "registrationClose" | "startDate" | "endDate">,
  now: Date,
  todayIso: string
): RegistrationState {
  if (info.endDate < todayIso) return "closed";
  if (!info.registrationOpen || !info.registrationClose) return "unknown";
  const open = Date.parse(info.registrationOpen);
  const close = Date.parse(info.registrationClose);
  if (!Number.isFinite(open) || !Number.isFinite(close)) return "unknown";
  if (now.getTime() < open) return "notYet";
  return now.getTime() <= close ? "open" : "closed";
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function daysUntil(startDate: string, todayIso: string): number {
  return Math.round((Date.parse(`${startDate}T00:00:00Z`) - Date.parse(`${todayIso}T00:00:00Z`)) / MS_PER_DAY);
}

export function formatEntryFee(
  fee: { lowestDenomination: number; currency: string } | null,
  language: Language
): string | null {
  if (!fee) return null;
  try {
    const format = new Intl.NumberFormat(localeOf(language), { style: "currency", currency: fee.currency });
    const digits = format.resolvedOptions().maximumFractionDigits ?? 2;
    return format.format(fee.lowestDenomination / 10 ** digits);
  } catch {
    return `${fee.lowestDenomination} ${fee.currency}`;
  }
}

export function formatDateTime(iso: string | null, language: Language): string | null {
  if (!iso) return null;
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return null;
  return new Intl.DateTimeFormat(localeOf(language), { dateStyle: "medium", timeStyle: "short" }).format(time);
}

export function formatClock(iso: string, timezone: string, language: Language): string {
  const options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: false };
  try {
    return new Intl.DateTimeFormat(localeOf(language), { ...options, timeZone: timezone }).format(Date.parse(iso));
  } catch {
    return new Intl.DateTimeFormat(localeOf(language), { ...options, timeZone: "UTC" }).format(Date.parse(iso));
  }
}

export function localDate(iso: string, timezone: string): string {
  const parts = (zone: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(Date.parse(iso));
  try {
    return parts(timezone);
  } catch {
    return parts("UTC");
  }
}

export type ScheduleDay = { date: string; items: ScheduleItem[] };

// Groups by the calendar day at the venue, not in the viewer's time zone.
export function groupScheduleByDay(items: readonly ScheduleItem[]): ScheduleDay[] {
  const days = new Map<string, ScheduleItem[]>();
  for (const item of items) {
    const date = localDate(item.startTime, item.timezone);
    const list = days.get(date);
    if (list) list.push(item);
    else days.set(date, [item]);
  }
  return [...days.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, list]) => ({ date, items: list }));
}

export function formatDayHeading(date: string, language: Language): string {
  return new Intl.DateTimeFormat(localeOf(language), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    Date.parse(`${date}T00:00:00Z`)
  );
}

export function mapsUrl(info: Pick<CompetitionInfo, "latitude" | "longitude" | "venueAddress" | "venue">): string | null {
  if (info.latitude !== null && info.longitude !== null)
    return `https://www.google.com/maps/search/?api=1&query=${info.latitude},${info.longitude}`;
  const query = info.venueAddress ?? info.venue;
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}

const FINAL_ROUNDS = new Set(["c", "f"]);

export function isFinalRound(roundTypeId: string) {
  return FINAL_ROUNDS.has(roundTypeId);
}

export function formatResultCell(eventId: string, field: "single" | "average", value: number): string {
  if (value === -1) return "DNF";
  if (value === -2) return "DNS";
  return formatWcaRecordValue(eventId, field, value > 0 ? value : null);
}

// Fewest-moves attempts are move counts, everything else is centiseconds.
export function formatAttempt(eventId: string, value: number): string {
  if (value === -1) return "DNF";
  if (value === -2) return "DNS";
  if (value === 0) return "—";
  return formatWcaRecordValue(eventId, "single", value);
}

export function sortSections(items: readonly MyCompetition[]) {
  return {
    ongoing: items.filter(item => item.status === "ongoing"),
    upcoming: items.filter(item => item.status === "upcoming"),
  };
}

export type RoundInfo = MyCompetitionDetail["rounds"][number];

// Time limits and cutoffs arrive in centiseconds, except multi-blind cutoffs,
// which use the WCA multi-blind encoding.
export function formatRoundTime(eventId: string, centiseconds: number): string {
  return formatWcaRecordValue(eventId, "single", centiseconds);
}

export function groupRoundsByEvent(rounds: readonly RoundInfo[]): Array<{ eventId: string; rounds: RoundInfo[] }> {
  const groups = new Map<string, RoundInfo[]>();
  for (const round of rounds) {
    const list = groups.get(round.eventId);
    if (list) list.push(round);
    else groups.set(round.eventId, [round]);
  }
  return [...groups.entries()].map(([eventId, list]) => ({
    eventId,
    rounds: list.sort((left, right) => left.round - right.round),
  }));
}
