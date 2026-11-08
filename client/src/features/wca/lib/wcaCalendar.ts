import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../../server/routers";
import type { Language, Translate } from "@/lib/i18n";

/**
 * The shapes the WCA router hands back, derived from the router itself so
 * the calendar can never drift away from the API it reads.
 */
type WcaRouterOutput = inferRouterOutputs<AppRouter>["wca"];

export type WcaCompetition = WcaRouterOutput["competitions"][number];
export type WcaCountry = WcaRouterOutput["countries"][number];
export type WcaWorldRecord = WcaRouterOutput["worldRecords"][number];

/** A venue, with the markdown link the WCA feed writes split apart. */
export type VenueInfo = { text: string; href: string | null };

/** The two lines of the date block that opens every row. */
export type DayRange = { days: string; months: string };

/** One month of the calendar and the competitions that start in it. */
export type MonthGroup = { key: string; year: number; month: number; competitions: WcaCompetition[] };

/** A ready-made date range the visitor can pick in one click. */
export type RangePreset = { id: string; days: number };

export const RANGE_PRESETS: readonly RangePreset[] = [
  { id: "30", days: 30 },
  { id: "90", days: 90 },
  { id: "365", days: 365 },
];

export const DEFAULT_PRESET_ID = "90";

const MARKDOWN_LINK = /\[([^\]]*)\]\(([^)\s]+)\)/;

function localeOf(language: Language) {
  return language === "vi" ? "vi-VN" : "en-US";
}

/** Reads a `YYYY-MM-DD` day as a date that never shifts with the time zone. */
export function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

/** The calendar day of a date, in the visitor's own time zone. */
export function toIsoDate(date: Date): string {
  const year = `${date.getFullYear()}`.padStart(4, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function dayOf(value: string) {
  return Number(value.slice(8, 10));
}

function monthOf(value: string) {
  return Number(value.slice(5, 7));
}

function yearOf(value: string) {
  return Number(value.slice(0, 4));
}

/**
 * The WCA feed writes venues as markdown links, so the raw text would show up
 * as `[Name](https://…)` on the page. This pulls the name and the address
 * apart so the venue can become a real link.
 */
export function parseVenue(venue: string | null | undefined): VenueInfo {
  if (!venue) return { text: "", href: null };
  const trimmed = venue.trim();
  if (!trimmed) return { text: "", href: null };
  const whole = /^\[([^\]]*)\]\(([^)\s]+)\)$/.exec(trimmed);
  if (whole) return { text: whole[1], href: whole[2] };
  const inner = MARKDOWN_LINK.exec(trimmed);
  if (inner) return { text: trimmed.replace(inner[0], inner[1]), href: inner[2] };
  return { text: trimmed, href: null };
}

/**
 * The name of a month, in the language of the interface. The Vietnamese
 * locale writes "Tháng 10" with a capital letter; a month is a common noun
 * here, so it reads better in lower case next to a day number.
 */
function monthName(date: Date, language: Language, style: "short" | "long") {
  const name = new Intl.DateTimeFormat(localeOf(language), { month: style, timeZone: "UTC" }).format(date);
  if (language !== "vi") return name;
  return name.charAt(0).toLowerCase() + name.slice(1);
}

/**
 * The day block of a row: the day numbers on the first line and the months
 * they belong to on the second. A competition that runs into the next month
 * keeps its start month in the group heading, so the block only spells out
 * where the competition ends.
 */
export function formatDayRange(start: string, end: string, language: Language): DayRange {
  const shortMonth = (value: string) => monthName(parseIsoDate(value), language, "short");

  if (start === end) {
    return { days: `${dayOf(start)}`, months: shortMonth(start) };
  }
  if (monthOf(start) === monthOf(end) && yearOf(start) === yearOf(end)) {
    return { days: `${dayOf(start)}–${dayOf(end)}`, months: shortMonth(start) };
  }
  const endMonth = shortMonth(end);
  const year = yearOf(end) === yearOf(start) ? "" : ` ${yearOf(end)}`;
  return { days: `${dayOf(start)}`, months: `→ ${dayOf(end)} ${endMonth}${year}` };
}

/** The heading of a month group, for example `tháng 10 · 2026`. */
export function monthLabel(year: number, month: number, language: Language): string {
  const date = new Date(Date.UTC(year, month, 1));
  return `${monthName(date, language, "long")} · ${year}`;
}

/** Groups the competitions by the month they start in, oldest month first. */
export function groupByMonth(competitions: readonly WcaCompetition[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();
  for (const competition of competitions) {
    const year = yearOf(competition.startDate);
    const month = monthOf(competition.startDate) - 1;
    const key = `${year}-${`${month + 1}`.padStart(2, "0")}`;
    const group = groups.get(key) ?? { key, year, month, competitions: [] };
    group.competitions.push(competition);
    groups.set(key, group);
  }
  return Array.from(groups.values()).sort((left, right) => left.year - right.year || left.month - right.month);
}

/** Whether a competition matches what the visitor typed in the search box. */
export function matchesQuery(competition: WcaCompetition, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const venue = parseVenue(competition.venueName).text;
  return [competition.name, competition.cityName, competition.countryName, competition.countryIso2, venue]
    .some((value) => value.toLowerCase().includes(needle));
}

/** The place of a competition, as one readable line. */
export function locationLabel(competition: WcaCompetition): string {
  return [competition.cityName, competition.countryName].filter(Boolean).join(", ");
}

/**
 * The flag of a country as an emoji, so a long list can be scanned by eye.
 * Two letters of the ISO code become the two regional indicator symbols.
 */
export function flagEmoji(iso2: string): string {
  if (!/^[A-Za-z]{2}$/.test(iso2)) return "";
  const base = 0x1f1e6;
  return String.fromCodePoint(base + iso2.charCodeAt(0) - 65, base + iso2.charCodeAt(1) - 65);
}

/**
 * The name of a competition status. Only the statuses the app knows get a
 * sentence; the rest keep whatever the WCA feed wrote.
 */
export function competitionStatusLabel(status: string, t: Translate): string {
  if (status === "approved") return t("wca.status.approved");
  if (status === "cancelled") return t("wca.status.cancelled");
  return status;
}
