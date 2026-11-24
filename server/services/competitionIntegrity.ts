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
