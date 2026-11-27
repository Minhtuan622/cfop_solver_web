import { fetchWcaJson, WcaApiError, type WcaCallerKey } from "./http";
import { normalizeWcaId } from "./queries";
import type {
  WcaCompetitionDetail,
  WcaCompetitionDetailPayload,
  WcaCompetitionInfo,
  WcaMyCompetition,
  WcaMyCompetitions,
  WcaPastSummary,
  WcaPerson,
  WcaPersonResultPayload,
  WcaResultRow,
  WcaSchedulePayload,
  WcaScheduleItem,
} from "./types";

const WCA_SITE = "https://www.worldcubeassociation.org";
export const PAST_PAGE_SIZE = 8;
const FINAL_ROUNDS = new Set(["c", "f"]);

const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const number = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

function people(
  list: Array<{ name?: string | null; wca_id?: string | null }> | null | undefined
): WcaPerson[] {
  return (list ?? []).flatMap(person => {
    const name = text(person.name);
    return name ? [{ name, wcaId: text(person.wca_id) }] : [];
  });
}

// The detail payload also carries delegate e-mail addresses; only names and
// WCA IDs are copied here.
export function toCompetitionInfo(payload: WcaCompetitionDetailPayload): WcaCompetitionInfo {
  const wcaUrl = text(payload.url) ?? `${WCA_SITE}/competitions/${payload.id}`;
  const website = text(payload.website);
  const fee = number(payload.base_entry_fee_lowest_denomination);
  const currency = text(payload.currency_code);
  return {
    id: payload.id,
    name: payload.name,
    shortName: text(payload.short_display_name) ?? text(payload.short_name) ?? payload.name,
    startDate: payload.start_date,
    endDate: payload.end_date,
    city: text(payload.city) ?? text(payload.city_name) ?? "",
    countryIso2: text(payload.country_iso2) ?? text(payload.country?.iso2) ?? "",
    venue: text(payload.venue),
    venueAddress: text(payload.venue_address),
    venueDetails: text(payload.venue_details),
    latitude: number(payload.latitude_degrees),
    longitude: number(payload.longitude_degrees),
    eventIds: Array.isArray(payload.event_ids)
      ? payload.event_ids.filter((id): id is string => typeof id === "string")
      : [],
    mainEventId: text(payload.main_event_id),
    registrationOpen: text(payload.registration_open),
    registrationClose: text(payload.registration_close),
    announcedAt: text(payload.announced_at),
    cancelledAt: text(payload.cancelled_at),
    resultsPostedAt: text(payload.results_posted_at),
    competitorLimit: number(payload.competitor_limit),
    entryFee: fee !== null && currency ? { lowestDenomination: fee, currency } : null,
    guestsEnabled: typeof payload.guests_enabled === "boolean" ? payload.guests_enabled : null,
    externalRegistrationPage: text(payload.external_registration_page),
    website: website && website !== wcaUrl ? website : null,
    wcaUrl,
    liveUrl: `https://live.worldcubeassociation.org/link/competitions/${payload.id}`,
    delegates: people(payload.delegates),
    organizers: people(payload.organizers),
  };
}

export function competitionStatus(
  info: Pick<WcaCompetitionInfo, "startDate" | "endDate">,
  today: string
): "ongoing" | "upcoming" | "past" {
  if (info.endDate < today) return "past";
  return info.startDate > today ? "upcoming" : "ongoing";
}

export function summarizeResults(rows: WcaPersonResultPayload[]): WcaPastSummary[] {
  const byCompetition = new Map<string, WcaPersonResultPayload[]>();
  for (const row of rows) {
    const list = byCompetition.get(row.competition_id);
    if (list) list.push(row);
    else byCompetition.set(row.competition_id, [row]);
  }
  return [...byCompetition.entries()]
    .map(([competitionId, list]) => ({
      competitionId,
      events: new Set(list.map(row => row.event_id)).size,
      rounds: list.length,
      podiums: list.filter(
        row =>
          FINAL_ROUNDS.has(row.round_type_id) &&
          typeof row.pos === "number" &&
          row.pos >= 1 &&
          row.pos <= 3 &&
          (row.best ?? 0) > 0
      ).length,
      // Result ids grow as results are imported, which follows the calendar
      // closely enough to put the latest competitions first.
      recency: Math.max(...list.map(row => row.id)),
    }))
    .sort((left, right) => right.recency - left.recency);
}

export function resultRowsFor(rows: WcaPersonResultPayload[], competitionId: string): WcaResultRow[] {
  return rows
    .filter(row => row.competition_id === competitionId)
    .map(row => ({
      eventId: row.event_id,
      roundTypeId: row.round_type_id,
      position: typeof row.pos === "number" ? row.pos : null,
      best: row.best ?? 0,
      average: row.average ?? 0,
      attempts: (row.attempts ?? []).filter(value => typeof value === "number"),
      singleRecord: text(row.regional_single_record),
      averageRecord: text(row.regional_average_record),
    }))
    .sort((left, right) => left.eventId.localeCompare(right.eventId) || left.roundTypeId.localeCompare(right.roundTypeId));
}

const ROUND_CODE = /^([a-z0-9]+)-r(\d+)$/;

export function scheduleItems(payload: WcaSchedulePayload): WcaScheduleItem[] {
  const items: WcaScheduleItem[] = [];
  for (const venue of payload.venues ?? []) {
    const timezone = text(venue.timezone) ?? "UTC";
    for (const room of venue.rooms ?? []) {
      for (const activity of room.activities ?? []) {
        const startTime = text(activity.startTime);
        const endTime = text(activity.endTime);
        const code = text(activity.activityCode);
        if (!startTime || !endTime || !code) continue;
        const match = ROUND_CODE.exec(code);
        items.push({
          code,
          name: text(activity.name) ?? code,
          eventId: match ? match[1] : null,
          round: match ? Number(match[2]) : null,
          room: text(room.name) ?? "",
          startTime,
          endTime,
          timezone,
        });
      }
    }
  }
  return items.sort((left, right) => left.startTime.localeCompare(right.startTime));
}

type UpcomingPayload = {
  user?: { id?: number | null };
  upcoming_competitions?: WcaCompetitionDetailPayload[] | null;
};

const personPath = (wcaId: string) => `/persons/${encodeURIComponent(wcaId)}`;
const fetchResults = (wcaId: string, caller: WcaCallerKey) =>
  fetchWcaJson<WcaPersonResultPayload[]>(`${personPath(wcaId)}/results`, 10 * 60 * 1000, caller);

async function fetchUpcoming(wcaId: string, caller: WcaCallerKey) {
  return fetchWcaJson<UpcomingPayload>(
    `/users/${encodeURIComponent(wcaId)}?upcoming_competitions=true`,
    5 * 60 * 1000,
    caller
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function getWcaPastCompetitions(
  rawWcaId: string,
  offset: number,
  caller: WcaCallerKey
): Promise<{ total: number; items: WcaMyCompetition[] }> {
  const wcaId = normalizeWcaId(rawWcaId);
  const summaries = summarizeResults(await fetchResults(wcaId, caller));
  const slice = summaries.slice(offset, offset + PAST_PAGE_SIZE);
  const details = await Promise.all(
    slice.map(async summary => {
      try {
        const payload = await fetchWcaJson<WcaCompetitionDetailPayload>(
          `/competitions/${encodeURIComponent(summary.competitionId)}`,
          60 * 60 * 1000,
          caller
        );
        return { summary, info: toCompetitionInfo(payload) };
      } catch (error) {
        if (error instanceof WcaApiError && error.kind === "NOT_FOUND") return null;
        throw error;
      }
    })
  );
  const items = details
    .flatMap(entry => (entry ? [entry] : []))
    .sort((left, right) => right.info.startDate.localeCompare(left.info.startDate))
    .map(({ summary, info }) => ({ status: "past" as const, competition: info, summary }));
  return { total: summaries.length, items };
}

export async function getWcaMyCompetitions(
  rawWcaId: string,
  caller: WcaCallerKey
): Promise<WcaMyCompetitions> {
  const wcaId = normalizeWcaId(rawWcaId);
  const [upcomingPayload, past] = await Promise.all([
    fetchUpcoming(wcaId, caller),
    getWcaPastCompetitions(wcaId, 0, caller),
  ]);
  const now = today();
  const upcoming = (upcomingPayload.upcoming_competitions ?? [])
    .map(toCompetitionInfo)
    .map((info): WcaMyCompetition => ({ status: competitionStatus(info, now), competition: info, summary: null }))
    .filter(entry => entry.status !== "past")
    .sort((left, right) => left.competition.startDate.localeCompare(right.competition.startDate));
  const upcomingIds = new Set(upcoming.map(entry => entry.competition.id));
  return {
    wcaId,
    upcoming,
    past: { total: past.total, items: past.items.filter(entry => !upcomingIds.has(entry.competition.id)) },
  };
}

export async function getWcaCompetitionDetail(
  rawWcaId: string,
  competitionId: string,
  caller: WcaCallerKey
): Promise<WcaCompetitionDetail> {
  const wcaId = normalizeWcaId(rawWcaId);
  const id = encodeURIComponent(competitionId);
  const [payload, schedulePayload, results, user] = await Promise.all([
    fetchWcaJson<WcaCompetitionDetailPayload>(`/competitions/${id}`, 10 * 60 * 1000, caller),
    fetchWcaJson<WcaSchedulePayload>(`/competitions/${id}/schedule`, 10 * 60 * 1000, caller).catch(
      error => {
        if (error instanceof WcaApiError && error.kind === "NOT_FOUND") return {} as WcaSchedulePayload;
        throw error;
      }
    ),
    fetchResults(wcaId, caller),
    fetchUpcoming(wcaId, caller),
  ]);
  const userId = user.user?.id ?? null;
  let registeredEventIds: string[] | null = null;
  if (userId !== null) {
    try {
      const registrations = await fetchWcaJson<
        Array<{ user_id?: number; event_ids?: string[] }>
      >(`/competitions/${id}/registrations`, 5 * 60 * 1000, caller);
      const mine = registrations.find(entry => entry.user_id === userId);
      registeredEventIds = mine ? (mine.event_ids ?? []).filter(item => typeof item === "string") : null;
    } catch (error) {
      if (!(error instanceof WcaApiError)) throw error;
    }
  }
  return {
    competition: toCompetitionInfo(payload),
    schedule: scheduleItems(schedulePayload),
    registeredEventIds,
    results: resultRowsFor(results, competitionId),
  };
}
