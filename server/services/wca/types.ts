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

export type WcaRecordTable = WcaWorldRecord[];

export type WcaRegionRecords = {
  world: WcaRecordTable;
  continents: Array<{ id: string; name: string; records: WcaRecordTable }>;
  countries: Array<{ name: string; iso2: string | null; records: WcaRecordTable }>;
};

export type WcaRecentRecord = {
  id: string;
  tag: string;
  type: "single" | "average";
  eventId: string;
  attemptResult: number;
  personName: string;
  wcaId: string | null;
  countryIso2: string | null;
  competitionId: string | null;
  competitionName: string;
  enteredAt: string | null;
};

export type WcaLiveRecentPayload = {
  recentRecords?: Array<{
    tag?: string | null;
    type?: string | null;
    attemptResult?: number | null;
    result?: {
      enteredAt?: string | null;
      person?: { name?: string | null; wcaId?: string | null; country?: { iso2?: string | null } | null } | null;
      round?: {
        competitionEvent?: {
          event?: { id?: string | null } | null;
          competition?: { name?: string | null; wcaId?: string | null } | null;
        } | null;
      } | null;
    } | null;
  }> | null;
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

type RawRecordTable = Record<string, { single?: number | null; average?: number | null } | null>;

export type WcaRecordsPayload = {
  world_records?: RawRecordTable | null;
  continental_records?: Record<string, RawRecordTable | null> | null;
  national_records?: Record<string, RawRecordTable | null> | null;
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
  information?: string | null;
  extra_registration_requirements?: string | null;
  refund_policy_percent?: number | null;
  refund_policy_limit_date?: string | null;
  event_change_deadline_date?: string | null;
  waiting_list_deadline_date?: string | null;
  on_the_spot_registration?: boolean | null;
  on_the_spot_entry_fee_lowest_denomination?: number | null;
  events_per_registration_limit?: number | null;
  guests_per_registration_limit?: number | null;
  guests_entry_fee_lowest_denomination?: number | null;
  number_of_bookmarks?: number | null;
  competition_series_ids?: string[] | null;
  qualification_results?: boolean | null;
  spots_left?: number | null;
  waiting_list_count?: number | null;
  "registration_full?"?: boolean | null;
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
  guestsPerRegistrationLimit: number | null;
  guestsEntryFee: number | null;
  eventsPerRegistrationLimit: number | null;
  onTheSpotRegistration: boolean | null;
  onTheSpotEntryFee: number | null;
  refundPolicyPercent: number | null;
  refundPolicyLimitDate: string | null;
  eventChangeDeadlineDate: string | null;
  waitingListDeadlineDate: string | null;
  qualificationResults: boolean | null;
  spotsLeft: number | null;
  waitingListCount: number | null;
  registrationFull: boolean | null;
  numberOfBookmarks: number | null;
  scoretakingSoftware: string | null;
  seriesIds: string[];
  information: string | null;
  extraRegistrationRequirements: string | null;
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

export type WcaRoundInfo = {
  id: string;
  eventId: string;
  round: number;
  format: string;
  timeLimitCentiseconds: number | null;
  timeLimitCumulative: boolean;
  cutoff: { attempts: number; centiseconds: number } | null;
  advancement: { type: string; level: number } | null;
  scrambleSetCount: number | null;
};

export type WcaEventsPayload = Array<{
  id: string;
  rounds?: Array<{
    id: string;
    format?: string | null;
    timeLimit?: { centiseconds?: number | null; cumulativeRoundIds?: string[] | null } | null;
    cutoff?: { numberOfAttempts?: number | null; attemptResult?: number | null } | null;
    advancementCondition?: { type?: string | null; level?: number | null } | null;
    scrambleSetCount?: number | null;
  }> | null;
}>;

export type WcaCompetitionDetail = {
  competition: WcaCompetitionInfo;
  rounds: WcaRoundInfo[];
  registrations: { total: number; byEvent: Record<string, number> } | null;
  schedule: WcaScheduleItem[];
  /** Events the person is registered for; null when registrations are not public. */
  registeredEventIds: string[] | null;
  results: WcaResultRow[];
};

// ---- Explore: results, psych sheet, schedule, search, nearby, community ----

export type WcaCompetitionResultRow = {
  pos: number | null;
  name: string;
  wcaId: string | null;
  countryIso2: string;
  best: number | null;
  average: number | null;
  attempts: number[];
  singleRecord: string | null;
  averageRecord: string | null;
};

export type WcaCompetitionResultRound = {
  roundTypeId: string;
  formatId: string;
  rows: WcaCompetitionResultRow[];
};

export type WcaCompetitionResults = {
  events: Array<{ eventId: string; rounds: WcaCompetitionResultRound[] }>;
  resultCount: number;
};

export type WcaPsychRow = {
  pos: number;
  name: string;
  wcaId: string | null;
  countryIso2: string;
  single: { best: number | null; rank: number | null };
  average: { best: number | null; rank: number | null };
};

export type WcaPsychSheet = {
  eventId: string;
  sortBy: "single" | "average";
  rows: WcaPsychRow[];
};

export type WcaScheduleActivity = {
  id: number;
  parentId: number | null;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  roomName: string;
  roomColor: string | null;
  venueName: string;
  timezone: string;
};

export type WcaPersonAssignment = {
  activityId: number;
  assignmentCode: string;
  stationNumber: number | null;
};

export type WcaWcifPerson = {
  registrantId: number | null;
  wcaId: string | null;
  name: string;
  status: string | null;
  eventIds: string[];
  assignments: WcaPersonAssignment[];
};

export type WcaCompetitionSchedule = {
  timezone: string | null;
  activities: WcaScheduleActivity[];
  competitorCount: number;
  me: (WcaWcifPerson & {
    agenda: Array<WcaPersonAssignment & { activity: WcaScheduleActivity }>;
  }) | null;
};

export type WcaSearchPerson = {
  wcaId: string | null;
  name: string;
  countryIso2: string;
  countryName: string;
  avatarUrl: string | null;
  profileUrl: string;
};

export type WcaSearchCompetition = {
  id: string;
  name: string;
  city: string;
  countryIso2: string;
  startDate: string;
  endDate: string;
};

export type WcaSearchResult = {
  people: WcaSearchPerson[];
  competitions: WcaSearchCompetition[];
};

export type WcaNearbyCompetition = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  city: string;
  countryIso2: string;
  venue: string | null;
  venueAddress: string | null;
  registrationOpen: string | null;
  registrationClose: string | null;
  competitorLimit: number | null;
  entryFee: { lowestDenomination: number; currency: string } | null;
  mainEventId: string | null;
  eventIds: string[];
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  wcaUrl: string;
};

export type WcaDelegate = {
  wcaId: string | null;
  name: string;
  status: string;
  location: string | null;
  countryIso2: string;
  countryName: string;
  avatarUrl: string | null;
  profileUrl: string;
};

export type WcaTeamMember = { name: string; wcaId: string | null; status: string };
export type WcaTeam = { name: string; members: WcaTeamMember[] };

export type WcaCommunity = { delegates: WcaDelegate[]; teams: WcaTeam[] };

export type WcaScrambleProgram = {
  current: { name: string; information: string | null; download: string | null };
  allowed: string[];
};
