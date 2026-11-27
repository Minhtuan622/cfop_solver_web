import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../../server/routers";
import type { Language, Translate } from "@/lib/i18n";

type WcaRouterOutput = inferRouterOutputs<AppRouter>["wca"];

export type WcaCompetition = WcaRouterOutput["competitions"][number];
export type WcaCountry = WcaRouterOutput["countries"][number];

export type VenueInfo = { text: string; href: string | null };

export type DayRange = { days: string; months: string };

export type MonthGroup = { key: string; year: number; month: number; competitions: WcaCompetition[] };

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

export function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

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

function monthName(date: Date, language: Language, style: "short" | "long") {
  const name = new Intl.DateTimeFormat(localeOf(language), { month: style, timeZone: "UTC" }).format(date);
  if (language !== "vi") return name;
  return name.charAt(0).toLowerCase() + name.slice(1);
}

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

export function monthLabel(year: number, month: number, language: Language): string {
  const date = new Date(Date.UTC(year, month, 1));
  return `${monthName(date, language, "long")} · ${year}`;
}

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

export function matchesQuery(competition: WcaCompetition, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const venue = parseVenue(competition.venueName).text;
  return [competition.name, competition.cityName, competition.countryName, competition.countryIso2, venue]
    .some((value) => value.toLowerCase().includes(needle));
}

export function locationLabel(competition: WcaCompetition): string {
  return [competition.cityName, competition.countryName].filter(Boolean).join(", ");
}

export function flagEmoji(iso2: string): string {
  if (!/^[A-Za-z]{2}$/.test(iso2)) return "";
  const base = 0x1f1e6;
  return String.fromCodePoint(base + iso2.charCodeAt(0) - 65, base + iso2.charCodeAt(1) - 65);
}

export function competitionStatusLabel(status: string, t: Translate): string {
  if (status === "approved") return t("wca.status.approved");
  if (status === "cancelled") return t("wca.status.cancelled");
  return status;
}
