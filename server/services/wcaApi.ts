const WCA_API_BASE = "https://www.worldcubeassociation.org/api/v0";

type CacheEntry<T> = { expiresAt: number; value?: T; pending?: Promise<T> };
const memoryCache = new Map<string, CacheEntry<unknown>>();

export type WcaCountry = { id: string; name: string; iso2: string };

export type WcaCompetition = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  countryName: string;
  countryIso2: string;
  cityName: string;
  venueName: string | null;
  status: string;
  website: string | null;
  wcaUrl: string;
  /** The event IDs the WCA lists for this competition, in WCA order. */
  eventIds: string[];
};

export type WcaPersonalRecord = {
  eventId: string;
  singleCentiseconds: number | null;
  averageCentiseconds: number | null;
  singleRanks: { world: number | null; continental: number | null; country: number | null };
  averageRanks: { world: number | null; continental: number | null; country: number | null };
};

/**
 * A world record as the WCA stores it: the raw attempt result. Timed events
 * use centiseconds, 3×3 fewest moves uses moves (and centi-moves for the
 * average), and Multi-Blind packs several numbers into one value. The client
 * formats them because that is where the language of the page lives.
 */
export type WcaWorldRecord = {
  eventId: string;
  single: number | null;
  average: number | null;
};

/**
 * The events the WCA currently holds records for, in the order its own records
 * page lists them. Magic, Master Magic, 3×3 with feet and 3×3 multi-blind old
 * format are retired and must not appear on the calendar.
 */
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
  WCA_WORLD_RECORD_EVENT_ORDER.map((eventId, index) => [eventId, index]),
);

export type WcaProfile = {
  wcaId: string;
  name: string;
  countryName: string;
  countryIso2: string;
  avatarUrl: string | null;
  profileUrl: string;
  competitionCount: number;
  totalSolves: number;
  medals: { gold: number; silver: number; bronze: number; total: number };
  records: { national: number; continental: number; world: number; total: number };
  personalRecords: WcaPersonalRecord[];
};

type WcaCompetitionPayload = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  city?: string | null;
  city_name?: string | null;
  venue?: string | null;
  status?: string | null;
  country_iso2?: string | null;
  website?: string | null;
  url?: string | null;
  country?: { name?: string | null; iso2?: string | null } | null;
  event_ids?: string[] | null;
};

type WcaProfilePayload = {
  person?: {
    name?: string | null;
    wca_id?: string | null;
    country?: { name?: string | null; iso2?: string | null } | null;
    country_iso2?: string | null;
    url?: string | null;
    avatar?: { thumb_url?: string | null; url?: string | null } | null;
  };
  competition_count?: number | null;
  total_solves?: number | null;
  medals?: { gold?: number | null; silver?: number | null; bronze?: number | null; total?: number | null } | null;
  records?: { national?: number | null; continental?: number | null; world?: number | null; total?: number | null } | null;
  personal_records?: Record<string, {
    single?: { best?: number | null; world_rank?: number | null; continent_rank?: number | null; country_rank?: number | null } | null;
    average?: { best?: number | null; world_rank?: number | null; continent_rank?: number | null; country_rank?: number | null } | null;
  }> | null;
};

type WcaRecordsPayload = {
  world_records?: Record<string, {
    single?: number | null;
    average?: number | null;
  } | null> | null;
};

function asNonNegativeInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
}

function normalizeRecord(value: number | null | undefined) {
  return typeof value === "number" && value > 0 ? value : null;
}

async function fetchWcaJson<T>(path: string, cacheTtlMs: number): Promise<T> {
  const url = `${WCA_API_BASE}${path}`;
  const cached = memoryCache.get(url) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.pending) return cached.pending;
    if (cached.value !== undefined) return cached.value;
  }
  if (cached?.pending) return cached.pending;

  const pending = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
      if (response.status === 404) throw new WcaApiError("NOT_FOUND", "Không tìm thấy WCA ID hoặc dữ liệu WCA.");
      if (!response.ok) throw new WcaApiError("UNAVAILABLE", "WCA hiện chưa phản hồi dữ liệu. Hãy thử lại sau.");
      const value = await response.json() as T;
      memoryCache.set(url, { value, expiresAt: Date.now() + cacheTtlMs });
      return value;
    } catch (error) {
      if (error instanceof WcaApiError) throw error;
      throw new WcaApiError("UNAVAILABLE", "Không thể kết nối WCA lúc này. Hãy thử lại sau.");
    } finally {
      clearTimeout(timeout);
    }
  })();
  memoryCache.set(url, { pending, expiresAt: Number.POSITIVE_INFINITY });
  try {
    return await pending;
  } catch (error) {
    memoryCache.delete(url);
    throw error;
  }
}

export class WcaApiError extends Error {
  constructor(public readonly kind: "NOT_FOUND" | "UNAVAILABLE", message: string) {
    super(message);
  }
}

export function normalizeWcaId(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!/^\d{4}[A-Z]{4}\d{2}$/.test(normalized)) throw new WcaApiError("NOT_FOUND", "WCA ID cần theo dạng 2016ABCD01.");
  return normalized;
}

export async function getWcaCountries() {
  const countries = await fetchWcaJson<Array<{ id?: string; name?: string; iso2?: string }>>("/countries", 24 * 60 * 60 * 1000);
  return countries
    .filter((country): country is Required<Pick<WcaCountry, "id" | "name" | "iso2">> => Boolean(country.id && country.name && country.iso2))
    .map((country) => ({ id: country.id, name: country.name, iso2: country.iso2 }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getWcaCompetitions(input: { start: string; end: string; countryIso2?: string | null }) {
  const baseQuery = new URLSearchParams({ start: input.start, end: input.end, sort: "start_date" });
  if (input.countryIso2) baseQuery.set("country_iso2", input.countryIso2);

  const PAGE_SIZE = 500;
  const fetchPage = (page: number) => {
    const query = new URLSearchParams(baseQuery);
    query.set("per_page", String(PAGE_SIZE));
    query.set("page", String(page));
    return fetchWcaJson<WcaCompetitionPayload[]>(`/competitions?${query.toString()}`, 5 * 60 * 1000);
  };

  const all: WcaCompetitionPayload[] = [];
  const firstPage = await fetchPage(1);
  all.push(...firstPage);

  if (firstPage.length === PAGE_SIZE) {
    let page = 2;
    let hasMore = true;
    while (hasMore) {
      const batch = await Promise.all(Array.from({ length: 10 }, (_, index) => fetchPage(page + index).catch(() => [])));
      let stop = false;
      for (const items of batch) {
        if (Array.isArray(items)) {
          all.push(...items);
          if (items.length < PAGE_SIZE) stop = true;
        } else {
          stop = true;
        }
      }
      page += 10;
      hasMore = !stop && batch.some((items) => Array.isArray(items) && items.length === PAGE_SIZE);
    }
  }

  const countries = await getWcaCountries();
  const countryNames = new Map(countries.map((country) => [country.iso2, country.name]));
  return all.map((competition) => {
    const wcaUrl = competition.url ?? `https://www.worldcubeassociation.org/competitions/${competition.id}`;
    return {
      id: competition.id,
      name: competition.name,
      startDate: competition.start_date,
      endDate: competition.end_date,
      countryName: competition.country?.name ?? countryNames.get(competition.country_iso2 ?? "") ?? "",
      countryIso2: competition.country?.iso2 ?? competition.country_iso2 ?? "",
      cityName: competition.city_name ?? competition.city ?? "",
      venueName: competition.venue ?? null,
      status: competition.status ?? "approved",
      website: competition.website && competition.website !== wcaUrl ? competition.website : null,
      wcaUrl,
      eventIds: Array.isArray(competition.event_ids) ? competition.event_ids.filter((id): id is string => typeof id === "string") : [],
    } satisfies WcaCompetition;
  });
}

export async function getWcaProfile(rawWcaId: string): Promise<WcaProfile> {
  const wcaId = normalizeWcaId(rawWcaId);
  const payload = await fetchWcaJson<WcaProfilePayload>(`/persons/${encodeURIComponent(wcaId)}`, 10 * 60 * 1000);
  const person = payload.person;
  if (!person?.wca_id || !person.name) throw new WcaApiError("NOT_FOUND", "Không tìm thấy hồ sơ WCA này.");
  const records = Object.entries(payload.personal_records ?? {}).map(([eventId, record]) => ({
    eventId,
    singleCentiseconds: normalizeRecord(record.single?.best),
    averageCentiseconds: normalizeRecord(record.average?.best),
    singleRanks: { world: normalizeRecord(record.single?.world_rank), continental: normalizeRecord(record.single?.continent_rank), country: normalizeRecord(record.single?.country_rank) },
    averageRanks: { world: normalizeRecord(record.average?.world_rank), continental: normalizeRecord(record.average?.continent_rank), country: normalizeRecord(record.average?.country_rank) },
  })).sort((left, right) => left.eventId.localeCompare(right.eventId));
  return {
    wcaId: person.wca_id,
    name: person.name,
    countryName: person.country?.name ?? "",
    countryIso2: person.country?.iso2 ?? person.country_iso2 ?? "",
    avatarUrl: person.avatar?.thumb_url ?? person.avatar?.url ?? null,
    profileUrl: person.url ?? `https://www.worldcubeassociation.org/persons/${person.wca_id}`,
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

export async function getWcaWorldRecords(): Promise<WcaWorldRecord[]> {
  const payload = await fetchWcaJson<WcaRecordsPayload>("/records?region=world", 60 * 60 * 1000);
  const worldRecords = payload.world_records ?? {};
  return Object.entries(worldRecords)
    .flatMap(([eventId, record]) => {
      const rank = WCA_WORLD_RECORD_EVENT_RANK.get(eventId);
      if (rank === undefined || !record) return [];
      return [{
        rank,
        record: {
          eventId,
          single: normalizeRecord(record.single),
          average: normalizeRecord(record.average),
        } satisfies WcaWorldRecord,
      }];
    })
    .sort((left, right) => left.rank - right.rank)
    .map(({ record }) => record);
}

export function clearWcaMemoryCache() {
  memoryCache.clear();
}
