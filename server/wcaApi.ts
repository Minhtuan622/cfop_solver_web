const WCA_API_BASE = "https://www.worldcubeassociation.org/api/v0";

type CacheEntry<T> = { expiresAt: number; value: T };
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
};

export type WcaPersonalRecord = {
  eventId: string;
  singleCentiseconds: number | null;
  averageCentiseconds: number | null;
  worldRank: number | null;
  countryRank: number | null;
};

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
    single?: { best?: number | null; world_rank?: number | null; country_rank?: number | null } | null;
    average?: { best?: number | null; world_rank?: number | null; country_rank?: number | null } | null;
  }> | null;
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
  if (cached && cached.expiresAt > Date.now()) return cached.value;

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
  const query = new URLSearchParams({ start: input.start, end: input.end, sort: "start_date" });
  if (input.countryIso2) query.set("country_iso2", input.countryIso2);
  const [payload, countries] = await Promise.all([
    fetchWcaJson<WcaCompetitionPayload[]>(`/competitions?${query.toString()}`, 5 * 60 * 1000),
    getWcaCountries(),
  ]);
  const countryNames = new Map(countries.map((country) => [country.iso2, country.name]));
  return payload.map((competition) => {
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
    worldRank: normalizeRecord(record.average?.world_rank ?? record.single?.world_rank),
    countryRank: normalizeRecord(record.average?.country_rank ?? record.single?.country_rank),
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

export function clearWcaMemoryCache() {
  memoryCache.clear();
}
