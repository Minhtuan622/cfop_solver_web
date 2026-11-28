import { fetchWcaJson, fetchWcaJsonMapped, WcaApiError, type WcaCallerKey } from "./http";
import { toCompetitionInfo } from "./myCompetitions";
import { normalizeWcaId } from "./queries";
import type {
  WcaCommunity,
  WcaCompetitionDetailPayload,
  WcaCompetitionInfo,
  WcaCompetitionResultRound,
  WcaCompetitionResults,
  WcaCompetitionSchedule,
  WcaDelegate,
  WcaNearbyCompetition,
  WcaPersonAssignment,
  WcaPsychRow,
  WcaPsychSheet,
  WcaScheduleActivity,
  WcaScrambleProgram,
  WcaSearchResult,
  WcaTeam,
  WcaWcifPerson,
} from "./types";

const WCA_SITE = "https://www.worldcubeassociation.org";

const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const number = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

// Rounds in the order they are played.
const ROUND_ORDER = ["0", "h", "1", "d", "2", "e", "3", "g", "c", "f"];
const EVENT_ORDER = [
  "333", "222", "444", "555", "666", "777", "333bf", "333fm", "333oh", "clock",
  "minx", "pyram", "skewb", "sq1", "444bf", "555bf", "333mbf", "fto", "333mbo",
];

export function eventRank(eventId: string) {
  const index = EVENT_ORDER.indexOf(eventId);
  return index === -1 ? EVENT_ORDER.length : index;
}

// ---- Public competition info ----

export async function getWcaCompetitionInfo(
  id: string,
  caller: WcaCallerKey
): Promise<WcaCompetitionInfo> {
  const payload = await fetchWcaJson<WcaCompetitionDetailPayload>(
    `/competitions/${encodeURIComponent(id)}`,
    5 * 60 * 1000,
    caller
  );
  return toCompetitionInfo(payload);
}

// ---- Results (podium and every round) ----

type ResultPayload = {
  pos?: number | null;
  best?: number | null;
  average?: number | null;
  name?: string | null;
  country_iso2?: string | null;
  event_id: string;
  round_type_id: string;
  format_id?: string | null;
  wca_id?: string | null;
  attempts?: number[] | null;
  regional_single_record?: string | null;
  regional_average_record?: string | null;
};

export function groupCompetitionResults(rows: ResultPayload[]): WcaCompetitionResults {
  const byEvent = new Map<string, Map<string, WcaCompetitionResultRound>>();
  for (const row of rows) {
    const rounds = byEvent.get(row.event_id) ?? new Map<string, WcaCompetitionResultRound>();
    byEvent.set(row.event_id, rounds);
    const round = rounds.get(row.round_type_id) ?? {
      roundTypeId: row.round_type_id,
      formatId: row.format_id ?? "a",
      rows: [],
    };
    rounds.set(row.round_type_id, round);
    round.rows.push({
      pos: number(row.pos),
      name: text(row.name) ?? "",
      wcaId: text(row.wca_id),
      countryIso2: text(row.country_iso2) ?? "",
      best: number(row.best),
      average: number(row.average),
      attempts: Array.isArray(row.attempts) ? row.attempts.filter(value => typeof value === "number") : [],
      singleRecord: text(row.regional_single_record),
      averageRecord: text(row.regional_average_record),
    });
  }
  const orderOf = (round: WcaCompetitionResultRound) => {
    const index = ROUND_ORDER.indexOf(round.roundTypeId);
    return index === -1 ? ROUND_ORDER.length : index;
  };
  return {
    resultCount: rows.length,
    events: [...byEvent.entries()]
      .map(([eventId, rounds]) => ({
        eventId,
        rounds: [...rounds.values()]
          .map(round => ({
            ...round,
            rows: round.rows.sort(
              (left, right) =>
                (left.pos ?? Number.MAX_SAFE_INTEGER) - (right.pos ?? Number.MAX_SAFE_INTEGER)
            ),
          }))
          .sort((left, right) => orderOf(left) - orderOf(right)),
      }))
      .sort((left, right) => eventRank(left.eventId) - eventRank(right.eventId)),
  };
}

export async function getWcaCompetitionResults(
  id: string,
  caller: WcaCallerKey
): Promise<WcaCompetitionResults> {
  const rows = await fetchWcaJson<ResultPayload[]>(
    `/competitions/${encodeURIComponent(id)}/results`,
    10 * 60 * 1000,
    caller
  );
  return groupCompetitionResults(Array.isArray(rows) ? rows : []);
}

// ---- Psych sheet ----

type PsychPayload = {
  sort_by?: string | null;
  sorted_rankings?: Array<{
    name?: string | null;
    wca_id?: string | null;
    country_iso2?: string | null;
    average_best?: number | null;
    average_rank?: number | null;
    single_best?: number | null;
    single_rank?: number | null;
    pos?: number | null;
  }> | null;
};

export function normalizePsychSheet(eventId: string, payload: PsychPayload): WcaPsychSheet {
  const rows = (payload.sorted_rankings ?? []).flatMap((row, index): WcaPsychRow[] => {
    const name = text(row.name);
    if (!name) return [];
    const positive = (value: unknown) => {
      const parsed = number(value);
      return parsed !== null && parsed > 0 ? parsed : null;
    };
    return [
      {
        pos: number(row.pos) ?? index + 1,
        name,
        wcaId: text(row.wca_id),
        countryIso2: text(row.country_iso2) ?? "",
        single: { best: positive(row.single_best), rank: positive(row.single_rank) },
        average: { best: positive(row.average_best), rank: positive(row.average_rank) },
      },
    ];
  });
  return { eventId, sortBy: payload.sort_by === "single" ? "single" : "average", rows };
}

export async function getWcaPsychSheet(
  id: string,
  eventId: string,
  caller: WcaCallerKey
): Promise<WcaPsychSheet> {
  const payload = await fetchWcaJson<PsychPayload>(
    `/competitions/${encodeURIComponent(id)}/psych-sheet/${encodeURIComponent(eventId)}`,
    10 * 60 * 1000,
    caller
  );
  return normalizePsychSheet(eventId, payload);
}

// ---- Schedule and personal agenda from the public WCIF ----

type WcifActivity = {
  id: number;
  name?: string | null;
  activityCode?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  childActivities?: WcifActivity[] | null;
};

type WcifPayload = {
  persons?: Array<{
    name?: string | null;
    wcaId?: string | null;
    registrantId?: number | null;
    registration?: { eventIds?: string[] | null; status?: string | null } | null;
    assignments?: Array<{
      activityId: number;
      assignmentCode?: string | null;
      stationNumber?: number | null;
    }> | null;
  }> | null;
  schedule?: {
    venues?: Array<{
      name?: string | null;
      timezone?: string | null;
      rooms?: Array<{
        name?: string | null;
        color?: string | null;
        activities?: WcifActivity[] | null;
      }> | null;
    }> | null;
  } | null;
};

type ReducedWcif = {
  timezone: string | null;
  activities: WcaScheduleActivity[];
  people: WcaWcifPerson[];
};

export function reduceWcif(payload: WcifPayload): ReducedWcif {
  const activities: WcaScheduleActivity[] = [];
  let timezone: string | null = null;
  for (const venue of payload.schedule?.venues ?? []) {
    const zone = text(venue.timezone) ?? "UTC";
    timezone ??= zone;
    for (const room of venue.rooms ?? []) {
      const visit = (activity: WcifActivity, parentId: number | null) => {
        const start = text(activity.startTime);
        const end = text(activity.endTime);
        if (start && end)
          activities.push({
            id: activity.id,
            parentId,
            name: text(activity.name) ?? "",
            code: text(activity.activityCode) ?? "",
            startTime: start,
            endTime: end,
            roomName: text(room.name) ?? "",
            roomColor: text(room.color),
            venueName: text(venue.name) ?? "",
            timezone: zone,
          });
        for (const child of activity.childActivities ?? []) visit(child, activity.id);
      };
      for (const activity of room.activities ?? []) visit(activity, null);
    }
  }
  activities.sort((left, right) => left.startTime.localeCompare(right.startTime));
  const people = (payload.persons ?? [])
    .filter(person => person.registration?.status === "accepted")
    .map(
      (person): WcaWcifPerson => ({
        registrantId: number(person.registrantId),
        wcaId: text(person.wcaId),
        name: text(person.name) ?? "",
        status: text(person.registration?.status),
        eventIds: person.registration?.eventIds ?? [],
        assignments: (person.assignments ?? []).map(
          (assignment): WcaPersonAssignment => ({
            activityId: assignment.activityId,
            assignmentCode: text(assignment.assignmentCode) ?? "competitor",
            stationNumber: number(assignment.stationNumber),
          })
        ),
      })
    );
  return { timezone, activities, people };
}

export function pickMyAgenda(
  reduced: ReducedWcif,
  wcaId: string | null
): WcaCompetitionSchedule["me"] {
  if (!wcaId) return null;
  const me = reduced.people.find(person => person.wcaId === wcaId);
  if (!me) return null;
  const byId = new Map(reduced.activities.map(activity => [activity.id, activity]));
  const agenda = me.assignments.flatMap(assignment => {
    const activity = byId.get(assignment.activityId);
    return activity ? [{ ...assignment, activity }] : [];
  });
  agenda.sort((left, right) => left.activity.startTime.localeCompare(right.activity.startTime));
  return { ...me, agenda };
}

export async function getWcaCompetitionSchedule(
  id: string,
  wcaId: string | null,
  caller: WcaCallerKey
): Promise<WcaCompetitionSchedule> {
  const reduced = await fetchWcaJsonMapped<WcifPayload, ReducedWcif>(
    `/competitions/${encodeURIComponent(id)}/wcif/public`,
    10 * 60 * 1000,
    caller,
    "reduced",
    reduceWcif
  );
  return {
    timezone: reduced.timezone,
    activities: reduced.activities,
    competitorCount: reduced.people.length,
    me: pickMyAgenda(reduced, wcaId ? normalizeWcaId(wcaId) : null),
  };
}

// ---- Search ----

type SearchPayload<T> = { result?: T[] | null };
type SearchUser = {
  wca_id?: string | null;
  name?: string | null;
  country_iso2?: string | null;
  country?: { name?: string | null; iso2?: string | null } | null;
  avatar?: { thumb_url?: string | null; url?: string | null; is_default?: boolean | null } | null;
  url?: string | null;
  class?: string | null;
};
type SearchCompetition = {
  id?: string | null;
  name?: string | null;
  city?: string | null;
  country_iso2?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

export async function searchWca(query: string, caller: WcaCallerKey): Promise<WcaSearchResult> {
  const q = encodeURIComponent(query);
  const [users, competitions] = await Promise.all([
    fetchWcaJson<SearchPayload<SearchUser>>(`/search/users?q=${q}`, 10 * 60 * 1000, caller),
    fetchWcaJson<SearchPayload<SearchCompetition>>(`/search/competitions?q=${q}`, 10 * 60 * 1000, caller),
  ]);
  return {
    people: (users.result ?? []).flatMap(user => {
      const name = text(user.name);
      const wcaId = text(user.wca_id);
      // Accounts without a WCA ID have no public profile page.
      if (!name || !wcaId) return [];
      return [
        {
          wcaId,
          name,
          countryIso2: text(user.country_iso2) ?? text(user.country?.iso2) ?? "",
          countryName: text(user.country?.name) ?? "",
          avatarUrl: user.avatar?.is_default ? null : (text(user.avatar?.thumb_url) ?? text(user.avatar?.url)),
          profileUrl: text(user.url) ?? `${WCA_SITE}/persons/${wcaId}`,
        },
      ];
    }),
    competitions: (competitions.result ?? []).flatMap(competition => {
      const id = text(competition.id);
      const name = text(competition.name);
      if (!id || !name) return [];
      return [
        {
          id,
          name,
          city: text(competition.city) ?? "",
          countryIso2: text(competition.country_iso2) ?? "",
          startDate: text(competition.start_date) ?? "",
          endDate: text(competition.end_date) ?? "",
        },
      ];
    }),
  };
}

// ---- Competitions near a place ----

type IndexPayload = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  city?: string | null;
  country_iso2?: string | null;
  venue?: string | null;
  venue_address?: string | null;
  registration_open?: string | null;
  registration_close?: string | null;
  competitor_limit?: number | null;
  base_entry_fee_lowest_denomination?: number | null;
  currency_code?: string | null;
  main_event_id?: string | null;
  event_ids?: string[] | null;
  latitude_degrees?: number | null;
  longitude_degrees?: number | null;
};

export function distanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
) {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function normalizeNearby(
  rows: IndexPayload[],
  origin: { lat: number; lng: number } | null
): WcaNearbyCompetition[] {
  const list = rows.map((row): WcaNearbyCompetition => {
    const latitude = number(row.latitude_degrees);
    const longitude = number(row.longitude_degrees);
    const fee = number(row.base_entry_fee_lowest_denomination);
    const currency = text(row.currency_code);
    return {
      id: row.id,
      name: row.name,
      startDate: row.start_date,
      endDate: row.end_date,
      city: text(row.city) ?? "",
      countryIso2: text(row.country_iso2) ?? "",
      venue: text(row.venue),
      venueAddress: text(row.venue_address),
      registrationOpen: text(row.registration_open),
      registrationClose: text(row.registration_close),
      competitorLimit: number(row.competitor_limit),
      entryFee: fee !== null && currency ? { lowestDenomination: fee, currency } : null,
      mainEventId: text(row.main_event_id),
      eventIds: Array.isArray(row.event_ids) ? row.event_ids.filter(id => typeof id === "string") : [],
      latitude,
      longitude,
      distanceKm:
        origin && latitude !== null && longitude !== null
          ? Math.round(distanceKm(origin, { lat: latitude, lng: longitude }))
          : null,
      wcaUrl: `${WCA_SITE}/competitions/${row.id}`,
    };
  });
  return list.sort((left, right) =>
    origin
      ? (left.distanceKm ?? Number.MAX_SAFE_INTEGER) - (right.distanceKm ?? Number.MAX_SAFE_INTEGER)
      : left.startDate.localeCompare(right.startDate)
  );
}

export async function getWcaNearbyCompetitions(
  input: { countryIso2: string; today: string; origin: { lat: number; lng: number } | null },
  caller: WcaCallerKey
): Promise<WcaNearbyCompetition[]> {
  const rows: IndexPayload[] = [];
  for (let page = 1; page <= 5; page += 1) {
    const query = new URLSearchParams({
      country_iso2: input.countryIso2,
      start: input.today,
      sort: "start_date",
      per_page: "100",
      page: String(page),
    });
    const batch = await fetchWcaJson<IndexPayload[]>(
      `/competition_index?${query.toString()}`,
      10 * 60 * 1000,
      caller
    );
    rows.push(...batch);
    if (batch.length < 100) break;
  }
  return normalizeNearby(rows, input.origin);
}

// ---- Delegates and teams (without e-mail addresses) ----

type DelegatePayload = {
  wca_id?: string | null;
  name?: string | null;
  delegate_status?: string | null;
  location?: string | null;
  country_iso2?: string | null;
  country?: { name?: string | null } | null;
  avatar?: { thumb_url?: string | null; is_default?: boolean | null } | null;
  url?: string | null;
};

type RolePayload = {
  user?: { name?: string | null; wca_id?: string | null } | null;
  group?: { name?: string | null } | null;
  metadata?: { status?: string | null } | null;
};

export function normalizeDelegates(rows: DelegatePayload[]): WcaDelegate[] {
  return rows.flatMap((row): WcaDelegate[] => {
    const name = text(row.name);
    const status = text(row.delegate_status);
    if (!name || !status) return [];
    const wcaId = text(row.wca_id);
    return [
      {
        wcaId,
        name,
        status,
        location: text(row.location),
        countryIso2: text(row.country_iso2) ?? "",
        countryName: text(row.country?.name) ?? "",
        avatarUrl: row.avatar?.is_default ? null : text(row.avatar?.thumb_url),
        profileUrl: text(row.url) ?? (wcaId ? `${WCA_SITE}/persons/${wcaId}` : WCA_SITE),
      },
    ];
  });
}

export function normalizeTeams(rows: RolePayload[]): WcaTeam[] {
  const teams = new Map<string, WcaTeam>();
  for (const row of rows) {
    const group = text(row.group?.name);
    const name = text(row.user?.name);
    if (!group || !name) continue;
    const team = teams.get(group) ?? { name: group, members: [] };
    teams.set(group, team);
    team.members.push({
      name,
      wcaId: text(row.user?.wca_id),
      status: text(row.metadata?.status) ?? "member",
    });
  }
  const weight = (status: string) => (status === "leader" ? 0 : status === "senior_member" ? 1 : 2);
  return [...teams.values()]
    .map(team => ({
      ...team,
      members: team.members.sort(
        (left, right) => weight(left.status) - weight(right.status) || left.name.localeCompare(right.name)
      ),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function fetchAllPages<T>(basePath: string, caller: WcaCallerKey, maxPages: number) {
  const rows: T[] = [];
  const joiner = basePath.includes("?") ? "&" : "?";
  for (let page = 1; page <= maxPages; page += 1) {
    const batch = await fetchWcaJson<T[]>(
      `${basePath}${joiner}per_page=100&page=${page}`,
      6 * 60 * 60 * 1000,
      caller
    );
    rows.push(...batch);
    if (batch.length < 100) break;
  }
  return rows;
}

export async function getWcaCommunity(caller: WcaCallerKey): Promise<WcaCommunity> {
  const [delegates, roles] = await Promise.all([
    fetchAllPages<DelegatePayload>("/delegates", caller, 6),
    fetchAllPages<RolePayload>("/user_roles?isActive=true&groupType=teams_committees", caller, 3),
  ]);
  return {
    delegates: normalizeDelegates(delegates).sort(
      (left, right) =>
        left.countryName.localeCompare(right.countryName) || left.name.localeCompare(right.name)
    ),
    teams: normalizeTeams(roles),
  };
}

// ---- TNoodle version ----

export async function getWcaScrambleProgram(caller: WcaCallerKey): Promise<WcaScrambleProgram> {
  const payload = await fetchWcaJson<{
    current?: { name?: string | null; information?: string | null; download?: string | null } | null;
    allowed?: string[] | null;
  }>("/scramble-program", 6 * 60 * 60 * 1000, caller);
  const name = text(payload.current?.name);
  if (!name) throw new WcaApiError("UNAVAILABLE", "WCA hiện chưa phản hồi dữ liệu. Hãy thử lại sau.");
  return {
    current: {
      name,
      information: text(payload.current?.information),
      download: text(payload.current?.download),
    },
    allowed: (payload.allowed ?? []).filter(item => typeof item === "string"),
  };
}
