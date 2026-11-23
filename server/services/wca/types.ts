/** Kiểu dữ liệu của WCA API sau khi chuẩn hoá, và payload thô nhận được. */
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
  singleRanks: {
    world: number | null;
    continental: number | null;
    country: number | null;
  };
  averageRanks: {
    world: number | null;
    continental: number | null;
    country: number | null;
  };
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
  records: {
    national: number;
    continental: number;
    world: number;
    total: number;
  };
  personalRecords: WcaPersonalRecord[];
};

export type WcaCompetitionPayload = {
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

export type WcaProfilePayload = {
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
  medals?: {
    gold?: number | null;
    silver?: number | null;
    bronze?: number | null;
    total?: number | null;
  } | null;
  records?: {
    national?: number | null;
    continental?: number | null;
    world?: number | null;
    total?: number | null;
  } | null;
  personal_records?: Record<
    string,
    {
      single?: {
        best?: number | null;
        world_rank?: number | null;
        continent_rank?: number | null;
        country_rank?: number | null;
      } | null;
      average?: {
        best?: number | null;
        world_rank?: number | null;
        continent_rank?: number | null;
        country_rank?: number | null;
      } | null;
    }
  > | null;
};

export type WcaRecordsPayload = {
  world_records?: Record<
    string,
    {
      single?: number | null;
      average?: number | null;
    } | null
  > | null;
};
