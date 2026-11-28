import { fetchWcaJson, WcaApiError, type WcaCallerKey } from "./http";
import { normalizeWcaId } from "./queries";
import type {
  WcaCompetitionDetail,
  WcaCompetitionDetailPayload,
  WcaCompetitionInfo,
  WcaEventsPayload,
  WcaRoundInfo,
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
    guestsPerRegistrationLimit: number(payload.guests_per_registration_limit),
    guestsEntryFee: number(payload.guests_entry_fee_lowest_denomination),
    eventsPerRegistrationLimit: number(payload.events_per_registration_limit),
    onTheSpotRegistration:
      typeof payload.on_the_spot_registration === "boolean" ? payload.on_the_spot_registration : null,
    onTheSpotEntryFee: number(payload.on_the_spot_entry_fee_lowest_denomination),
    refundPolicyPercent: number(payload.refund_policy_percent),
    refundPolicyLimitDate: text(payload.refund_policy_limit_date),
    eventChangeDeadlineDate: text(payload.event_change_deadline_date),
    waitingListDeadlineDate: text(payload.waiting_list_deadline_date),
    qualificationResults:
      typeof payload.qualification_results === "boolean" ? payload.qualification_results : null,
    spotsLeft: number(payload.spots_left),
    waitingListCount: number(payload.waiting_list_count),
    registrationFull:
      typeof payload["registration_full?"] === "boolean" ? payload["registration_full?"] : null,
    numberOfBookmarks: number(payload.number_of_bookmarks),
    scoretakingSoftware: text(payload.scoretaking_software),
    seriesIds: Array.isArray(payload.competition_series_ids)
      ? payload.competition_series_ids.filter((id): id is string => typeof id === "string")
      : [],
    information: text(payload.information),
    extraRegistrationRequirements: text(payload.extra_registration_requirements),
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

const ROUND_FORMATS = new Set(["1", "2", "3", "a", "m"]);

export function roundInfos(payload: WcaEventsPayload): WcaRoundInfo[] {
  return payload.flatMap(event =>
    (event.rounds ?? []).flatMap(round => {
      const match = /-r(\d+)$/.exec(round.id);
      if (!match) return [];
      const cutoff = round.cutoff;
      const advancement = round.advancementCondition;
      return [
        {
          id: round.id,
          eventId: event.id,
          round: Number(match[1]),
          format: round.format && ROUND_FORMATS.has(round.format) ? round.format : (round.format ?? ""),
          timeLimitCentiseconds: number(round.timeLimit?.centiseconds),
          timeLimitCumulative: (round.timeLimit?.cumulativeRoundIds ?? []).length > 0,
          cutoff:
            cutoff && number(cutoff.numberOfAttempts) !== null && number(cutoff.attemptResult) !== null
              ? { attempts: cutoff.numberOfAttempts as number, centiseconds: cutoff.attemptResult as number }
              : null,
          advancement:
            advancement && text(advancement.type) && number(advancement.level) !== null
              ? { type: advancement.type as string, level: advancement.level as number }
              : null,
          scrambleSetCount: number(round.scrambleSetCount),
        },
      ];
    })
  );
}

// Every competition the person has a WCA record of, in one list: the finished
// ones come from the person's competition history, the upcoming and ongoing
// ones from their public registrations.
export async function getWcaMyCompetitions(
  rawWcaId: string,
  caller: WcaCallerKey
): Promise<WcaMyCompetitions> {
  const wcaId = normalizeWcaId(rawWcaId);
  const [upcomingPayload, historyPayload, results] = await Promise.all([
    fetchUpcoming(wcaId, caller),
    fetchWcaJson<WcaCompetitionDetailPayload[]>(`${personPath(wcaId)}/competitions`, 10 * 60 * 1000, caller),
    fetchResults(wcaId, caller),
  ]);
  const now = today();
  const summaries = new Map(summarizeResults(results).map(summary => [summary.competitionId, summary]));
  const byId = new Map<string, WcaMyCompetition>();
  for (const payload of [...historyPayload, ...(upcomingPayload.upcoming_competitions ?? [])]) {
    const info = toCompetitionInfo(payload);
    byId.set(info.id, {
      status: competitionStatus(info, now),
      competition: info,
      summary: summaries.get(info.id) ?? null,
    });
  }
  const all = [...byId.values()];
  return {
    wcaId,
    upcoming: all
      .filter(entry => entry.status !== "past")
      .sort((left, right) => left.competition.startDate.localeCompare(right.competition.startDate)),
    past: {
      total: all.filter(entry => entry.status === "past").length,
      items: all
        .filter(entry => entry.status === "past")
        .sort((left, right) => right.competition.startDate.localeCompare(left.competition.startDate)),
    },
  };
}

export async function getWcaCompetitionDetail(
  rawWcaId: string,
  competitionId: string,
  caller: WcaCallerKey
): Promise<WcaCompetitionDetail> {
  const wcaId = normalizeWcaId(rawWcaId);
  const id = encodeURIComponent(competitionId);
  const [payload, schedulePayload, results, user, eventsPayload] = await Promise.all([
    fetchWcaJson<WcaCompetitionDetailPayload>(`/competitions/${id}`, 10 * 60 * 1000, caller),
    fetchWcaJson<WcaSchedulePayload>(`/competitions/${id}/schedule`, 10 * 60 * 1000, caller).catch(
      error => {
        if (error instanceof WcaApiError && error.kind === "NOT_FOUND") return {} as WcaSchedulePayload;
        throw error;
      }
    ),
    fetchResults(wcaId, caller),
    fetchUpcoming(wcaId, caller),
    fetchWcaJson<WcaEventsPayload>(`/competitions/${id}/events`, 10 * 60 * 1000, caller).catch(error => {
      if (error instanceof WcaApiError && error.kind === "NOT_FOUND") return [] as WcaEventsPayload;
      throw error;
    }),
  ]);
  const userId = user.user?.id ?? null;
  let registeredEventIds: string[] | null = null;
  let registrations: WcaCompetitionDetail["registrations"] = null;
  try {
    const list = await fetchWcaJson<Array<{ user_id?: number; event_ids?: string[] }>>(
      `/competitions/${id}/registrations`,
      5 * 60 * 1000,
      caller
    );
    const byEvent: Record<string, number> = {};
    for (const entry of list)
      for (const eventId of entry.event_ids ?? []) byEvent[eventId] = (byEvent[eventId] ?? 0) + 1;
    registrations = { total: list.length, byEvent };
    const mine = userId === null ? undefined : list.find(entry => entry.user_id === userId);
    registeredEventIds = mine ? (mine.event_ids ?? []).filter(item => typeof item === "string") : null;
  } catch (error) {
    if (!(error instanceof WcaApiError)) throw error;
  }
  return {
    competition: toCompetitionInfo(payload),
    schedule: scheduleItems(schedulePayload),
    rounds: roundInfos(eventsPayload),
    registrations,
    registeredEventIds,
    results: resultRowsFor(results, competitionId),
  };
}
