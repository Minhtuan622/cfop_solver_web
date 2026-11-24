export type IntegrityFlag = "impossible_time" | "too_fast" | "repeated_time";

export const INTEGRITY_FLAGS: readonly IntegrityFlag[] = [
  "impossible_time",
  "too_fast",
  "repeated_time",
];

export const ROUND_TIME_TOLERANCE_MS = 5_000;

const MIN_PLAUSIBLE_MS: Record<string, number> = {
  "333": 1_500,
  "222": 300,
  "444": 8_000,
  "555": 17_000,
  "666": 33_000,
  "777": 48_000,
  "333oh": 3_000,
  pyram: 400,
  skewb: 400,
  sq1: 1_700,
  clock: 1_000,
  minx: 9_000,
};

const HARD_MIN_MS: Record<string, number> = {
  "222": 250,
  "333": 1_000,
  "333oh": 2_000,
  "333bf": 5_000,
  "333mbf": 10_000,
  "444": 5_000,
  "444bf": 20_000,
  "555": 12_000,
  "555bf": 40_000,
  "666": 25_000,
  "777": 35_000,
  pyram: 300,
  skewb: 300,
  minx: 8_000,
  fto: 2_000,
  sq1: 1_000,
  clock: 800,
};

export function isBelowHardFloor(eventId: string, elapsedMs: number) {
  const floor = HARD_MIN_MS[eventId];
  return floor !== undefined && elapsedMs < floor;
}

export type IntegrityInput = {
  eventId: string;
  elapsedMs: number;
  inspectionMs: number;
  roundStartedAt: Date | number;
  now?: number;
  previousElapsedMs: readonly number[];
};

export function competitionIntegrityFlags(input: IntegrityInput): IntegrityFlag[] {
  const flags: IntegrityFlag[] = [];
  const now = input.now ?? Date.now();
  const startedAt =
    input.roundStartedAt instanceof Date
      ? input.roundStartedAt.getTime()
      : input.roundStartedAt;
  const sinceStart = now - startedAt;
  if (input.elapsedMs + input.inspectionMs > sinceStart + ROUND_TIME_TOLERANCE_MS)
    flags.push("impossible_time");
  const floor = MIN_PLAUSIBLE_MS[input.eventId];
  if (floor !== undefined && input.elapsedMs < floor) flags.push("too_fast");
  if (input.previousElapsedMs.includes(input.elapsedMs)) flags.push("repeated_time");
  return flags;
}

export function serializeIntegrityFlags(flags: readonly IntegrityFlag[]) {
  return flags.join(",");
}

export function parseIntegrityFlags(value: string | null | undefined): IntegrityFlag[] {
  if (!value) return [];
  return value
    .split(",")
    .filter((flag): flag is IntegrityFlag =>
      (INTEGRITY_FLAGS as readonly string[]).includes(flag)
    );
}
