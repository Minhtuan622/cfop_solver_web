import { TRPCError } from "@trpc/server";
import { fetchWcaJson, WcaApiError, type WcaCallerKey } from "./http";
import type {
  WcaCompetition,
  WcaCompetitionPayload,
  WcaCountry,
  WcaProfile,
  WcaProfilePayload,
  WcaRecordsPayload,
  WcaWorldRecord,
} from "./types";

export const MAX_COMPETITION_DAYS = 366;
const MAX_COMPETITION_PAGES = 10;

const WCA_WORLD_RECORD_EVENT_ORDER = [
  "333",
  "222",
  "444",
  "555",
  "666",
  "777",
  "333bf",
  "333fm",
  "333oh",
  "clock",
  "minx",
  "pyram",
  "skewb",
  "sq1",
  "444bf",
  "555bf",
  "333mbf",
] as const;
const WCA_WORLD_RECORD_EVENT_RANK = new Map<string, number>(
  WCA_WORLD_RECORD_EVENT_ORDER.map((eventId, index) => [eventId, index])
);

function asNonNegativeInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : 0;
}

function normalizeRecord(value: number | null | undefined) {
  return typeof value === "number" && value > 0 ? value : null;
}

export function normalizeWcaId(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!/^\d{4}[A-Z]{4}\d{2}$/.test(normalized))
    throw new WcaApiError("NOT_FOUND", "WCA ID cần theo dạng 2016ABCD01.");
  return normalized;
}

export async function getWcaCountries(caller: WcaCallerKey) {
  const countries = await fetchWcaJson<
    Array<{ id?: string; name?: string; iso2?: string }>
  >("/countries", 24 * 60 * 60 * 1000, caller);
  return countries
    .filter(
      (
        country
      ): country is Required<Pick<WcaCountry, "id" | "name" | "iso2">> =>
        Boolean(country.id && country.name && country.iso2)
    )
    .map(country => ({
      id: country.id,
      name: country.name,
      iso2: country.iso2,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getWcaCompetitions(
  input: { start: string; end: string; countryIso2?: string | null },
  caller: WcaCallerKey
) {
  const start = new Date(input.start);
  const end = new Date(input.end);
  const days = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
  if (!Number.isFinite(days) || days < 0 || days > MAX_COMPETITION_DAYS) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Khoảng ngày quá dài. Tối đa 366 ngày.",
    });
  }

  const baseQuery = new URLSearchParams({
    start: input.start,
    end: input.end,
    sort: "start_date",
  });
  if (input.countryIso2) baseQuery.set("country_iso2", input.countryIso2);

  const PAGE_SIZE = 200;
  const fetchPage = (page: number) => {
    const query = new URLSearchParams(baseQuery);
    query.set("per_page", String(PAGE_SIZE));
    query.set("page", String(page));
    return fetchWcaJson<WcaCompetitionPayload[]>(
      `/competitions?${query.toString()}`,
      5 * 60 * 1000,
      caller
    );
  };

  const all: WcaCompetitionPayload[] = [];
  const firstPage = await fetchPage(1);
  all.push(...firstPage);

  if (firstPage.length === PAGE_SIZE) {
    for (let page = 2; page <= MAX_COMPETITION_PAGES; page += 1) {
      const next = await fetchPage(page);
      all.push(...next);
      if (next.length < PAGE_SIZE) break;
    }
  }

  const countries = await getWcaCountries(caller);
  const countryNames = new Map(
    countries.map(country => [country.iso2, country.name])
  );
  return all.map(competition => {
    const wcaUrl =
      competition.url ??
      `https://www.worldcubeassociation.org/competitions/${competition.id}`;
    return {
      id: competition.id,
      name: competition.name,
      startDate: competition.start_date,
      endDate: competition.end_date,
      countryName:
        competition.country?.name ??
        countryNames.get(competition.country_iso2 ?? "") ??
        "",
      countryIso2: competition.country?.iso2 ?? competition.country_iso2 ?? "",
      cityName: competition.city_name ?? competition.city ?? "",
      venueName: competition.venue ?? null,
      status: competition.status ?? "approved",
      website:
        competition.website && competition.website !== wcaUrl
          ? competition.website
          : null,
      wcaUrl,
      eventIds: Array.isArray(competition.event_ids)
        ? competition.event_ids.filter(
            (id): id is string => typeof id === "string"
          )
        : [],
    } satisfies WcaCompetition;
  });
}

export async function getWcaProfile(
  rawWcaId: string,
  caller: WcaCallerKey
): Promise<WcaProfile> {
  const wcaId = normalizeWcaId(rawWcaId);
  const payload = await fetchWcaJson<WcaProfilePayload>(
    `/persons/${encodeURIComponent(wcaId)}`,
    10 * 60 * 1000,
    caller
  );
  const person = payload.person;
  if (!person?.wca_id || !person.name)
    throw new WcaApiError("NOT_FOUND", "Không tìm thấy hồ sơ WCA này.");
  const records = Object.entries(payload.personal_records ?? {})
    .map(([eventId, record]) => ({
      eventId,
      singleCentiseconds: normalizeRecord(record.single?.best),
      averageCentiseconds: normalizeRecord(record.average?.best),
      singleRanks: {
        world: normalizeRecord(record.single?.world_rank),
        continental: normalizeRecord(record.single?.continent_rank),
        country: normalizeRecord(record.single?.country_rank),
      },
      averageRanks: {
        world: normalizeRecord(record.average?.world_rank),
        continental: normalizeRecord(record.average?.continent_rank),
        country: normalizeRecord(record.average?.country_rank),
      },
    }))
    .sort((left, right) => left.eventId.localeCompare(right.eventId));
  return {
    wcaId: person.wca_id,
    name: person.name,
    countryName: person.country?.name ?? "",
    countryIso2: person.country?.iso2 ?? person.country_iso2 ?? "",
    avatarUrl: person.avatar?.thumb_url ?? person.avatar?.url ?? null,
    profileUrl:
      person.url ??
      `https://www.worldcubeassociation.org/persons/${person.wca_id}`,
    competitionCount: asNonNegativeInteger(payload.competition_count),
    totalSolves: asNonNegativeInteger(payload.total_solves),
    medals: {
      gold: asNonNegativeInteger(payload.medals?.gold),
      silver: asNonNegativeInteger(payload.medals?.silver),
      bronze: asNonNegativeInteger(payload.medals?.bronze),
      total: asNonNegativeInteger(payload.medals?.total),
    },
    records: {
      national: asNonNegativeInteger(payload.records?.national),
      continental: asNonNegativeInteger(payload.records?.continental),
      world: asNonNegativeInteger(payload.records?.world),
      total: asNonNegativeInteger(payload.records?.total),
    },
    personalRecords: records,
  };
}

export async function getWcaWorldRecords(
  caller: WcaCallerKey
): Promise<WcaWorldRecord[]> {
  const payload = await fetchWcaJson<WcaRecordsPayload>(
    "/records?region=world",
    60 * 60 * 1000,
    caller
  );
  const worldRecords = payload.world_records ?? {};
  return Object.entries(worldRecords)
    .flatMap(([eventId, record]) => {
      const rank = WCA_WORLD_RECORD_EVENT_RANK.get(eventId);
      if (rank === undefined || !record) return [];
      return [
        {
          rank,
          record: {
            eventId,
            single: normalizeRecord(record.single),
            average: normalizeRecord(record.average),
          } satisfies WcaWorldRecord,
        },
      ];
    })
    .sort((left, right) => left.rank - right.rank)
    .map(({ record }) => record);
}
