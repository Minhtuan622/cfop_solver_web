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

// --- My competitions -------------------------------------------------------

export type WcaPerson = { name: string; wcaId: string | null };

export type WcaCompetitionDetailPayload = WcaCompetitionPayload & {
  short_name?: string | null;
  short_display_name?: string | null;
  venue_address?: string | null;
  venue_details?: string | null;
  latitude_degrees?: number | null;
  longitude_degrees?: number | null;
  main_event_id?: string | null;
  registration_open?: string | null;
  registration_close?: string | null;
  announced_at?: string | null;
  cancelled_at?: string | null;
  results_posted_at?: string | null;
  competitor_limit?: number | null;
  base_entry_fee_lowest_denomination?: number | null;
  currency_code?: string | null;
  guests_enabled?: boolean | null;
  external_registration_page?: string | null;
  scoretaking_software?: string | null;
  delegates?: Array<{ name?: string | null; wca_id?: string | null }> | null;
  organizers?: Array<{ name?: string | null; wca_id?: string | null }> | null;
};

export type WcaCompetitionInfo = {
  id: string;
  name: string;
  shortName: string;
  startDate: string;
  endDate: string;
  city: string;
  countryIso2: string;
  venue: string | null;
  venueAddress: string | null;
  venueDetails: string | null;
  latitude: number | null;
  longitude: number | null;
  eventIds: string[];
  mainEventId: string | null;
  registrationOpen: string | null;
  registrationClose: string | null;
  announcedAt: string | null;
  cancelledAt: string | null;
  resultsPostedAt: string | null;
  competitorLimit: number | null;
  entryFee: { lowestDenomination: number; currency: string } | null;
  guestsEnabled: boolean | null;
  externalRegistrationPage: string | null;
  website: string | null;
  wcaUrl: string;
  liveUrl: string;
  delegates: WcaPerson[];
  organizers: WcaPerson[];
};

export type WcaMyCompetitionStatus = "ongoing" | "upcoming" | "past";

export type WcaPastSummary = {
  competitionId: string;
  events: number;
  rounds: number;
  podiums: number;
  recency: number;
};

export type WcaMyCompetition = {
  status: WcaMyCompetitionStatus;
  competition: WcaCompetitionInfo;
  /** Only filled for past competitions. */
  summary: WcaPastSummary | null;
};

export type WcaMyCompetitions = {
  wcaId: string;
  upcoming: WcaMyCompetition[];
  past: { total: number; items: WcaMyCompetition[] };
};

export type WcaScheduleItem = {
  code: string;
  name: string;
  eventId: string | null;
  round: number | null;
  room: string;
  startTime: string;
  endTime: string;
  timezone: string;
};

export type WcaResultRow = {
  eventId: string;
  roundTypeId: string;
  position: number | null;
  best: number;
  average: number;
  attempts: number[];
  singleRecord: string | null;
  averageRecord: string | null;
};

export type WcaSchedulePayload = {
  venues?: Array<{
    name?: string | null;
    timezone?: string | null;
    rooms?: Array<{
      name?: string | null;
      activities?: Array<{
        name?: string | null;
        activityCode?: string | null;
        startTime?: string | null;
        endTime?: string | null;
      }> | null;
    }> | null;
  }> | null;
};

export type WcaPersonResultPayload = {
  id: number;
  competition_id: string;
  event_id: string;
  round_type_id: string;
  pos?: number | null;
  best?: number | null;
  average?: number | null;
  attempts?: number[] | null;
  regional_single_record?: string | null;
  regional_average_record?: string | null;
};

export type WcaCompetitionDetail = {
  competition: WcaCompetitionInfo;
  schedule: WcaScheduleItem[];
  /** Events the person is registered for; null when registrations are not public. */
  registeredEventIds: string[] | null;
  results: WcaResultRow[];
};
