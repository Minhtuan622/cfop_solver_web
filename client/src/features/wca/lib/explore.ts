import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../../server/routers";
import { localDate } from "./myCompetitions";

type WcaOutput = inferRouterOutputs<AppRouter>["wca"];

export type CompetitionResults = WcaOutput["competitionResults"];
export type ResultRound = CompetitionResults["events"][number]["rounds"][number];
export type ResultRow = ResultRound["rows"][number];
export type PsychSheet = WcaOutput["psychSheet"];
export type CompetitionSchedule = WcaOutput["competitionSchedule"];
export type ScheduleActivity = CompetitionSchedule["activities"][number];
export type NearbyCompetition = WcaOutput["nearby"][number];
export type Community = WcaOutput["community"];
export type Delegate = Community["delegates"][number];
export type SearchResult = WcaOutput["search"];

/** "333-r1-g2" -> event "333", round 1, group 2. */
export function parseActivityCode(code: string) {
  const match = /^([a-z0-9]+)-r(\d+)(?:-g(\d+))?(?:-a(\d+))?$/.exec(code);
  if (!match) return { eventId: null, round: null, group: null, attempt: null };
  return {
    eventId: match[1],
    round: Number(match[2]),
    group: match[3] ? Number(match[3]) : null,
    attempt: match[4] ? Number(match[4]) : null,
  };
}

export function groupActivitiesByDay<T extends { startTime: string; timezone: string }>(items: readonly T[]) {
  const days = new Map<string, T[]>();
  for (const item of items) {
    const date = localDate(item.startTime, item.timezone);
    const list = days.get(date);
    if (list) list.push(item);
    else days.set(date, [item]);
  }
  return [...days.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, items]) => ({ date, items }));
}

export function isPodiumRound(round: Pick<ResultRound, "roundTypeId">) {
  return round.roundTypeId === "f" || round.roundTypeId === "c";
}

export function podiumRows(round: ResultRound): ResultRow[] {
  return round.rows.filter(row => row.pos !== null && row.pos >= 1 && row.pos <= 3 && (row.best ?? 0) > 0);
}

export function distanceLabel(km: number | null): string | null {
  if (km === null) return null;
  return km < 1 ? "<1 km" : `${km.toLocaleString("en-US")} km`;
}

const DELEGATE_RANK: Record<string, number> = {
  senior_delegate: 0,
  regional_delegate: 1,
  delegate: 2,
  junior_delegate: 3,
  trainee_delegate: 4,
};

export function filterDelegates(list: readonly Delegate[], query: string, countryIso2: string): Delegate[] {
  const needle = query.trim().toLowerCase();
  return list
    .filter(delegate => !countryIso2 || delegate.countryIso2 === countryIso2)
    .filter(
      delegate =>
        !needle ||
        delegate.name.toLowerCase().includes(needle) ||
        (delegate.wcaId ?? "").toLowerCase().includes(needle) ||
        (delegate.location ?? "").toLowerCase().includes(needle)
    )
    .sort(
      (left, right) =>
        (DELEGATE_RANK[left.status] ?? 9) - (DELEGATE_RANK[right.status] ?? 9) ||
        left.name.localeCompare(right.name)
    );
}

export function delegateCountries(list: readonly Delegate[]) {
  const countries = new Map<string, string>();
  for (const delegate of list)
    if (delegate.countryIso2) countries.set(delegate.countryIso2, delegate.countryName);
  return [...countries.entries()]
    .map(([iso2, name]) => ({ iso2, name }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function defaultCountry(language: "vi" | "en", profileIso2: string | null | undefined) {
  return profileIso2 || (language === "vi" ? "VN" : "US");
}
