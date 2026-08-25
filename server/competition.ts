import { randomInt } from "node:crypto";

const FACES = ["U", "R", "F", "D", "L", "B"] as const;
const SUFFIXES = ["", "2", "'"] as const;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type CompetitionPenalty = "none" | "+2" | "DNF";
export type CompetitionResultValue = { elapsedMs: number; penalty: CompetitionPenalty };
export type CompetitionFormat = "best_of_3" | "ao5" | "ao12";

function sameAxis(first: string, second: string) { const axis = (face: string) => face === "U" || face === "D" ? 0 : face === "R" || face === "L" ? 1 : 2; return axis(first) === axis(second); }

export function createCompetitionCode(length = 6) { return Array.from({ length }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join(""); }

export function createSharedScramble(length = 20) {
  const moves: string[] = [];
  while (moves.length < length) {
    const face = FACES[randomInt(FACES.length)];
    const previous = moves.at(-1)?.[0];
    const before = moves.at(-2)?.[0];
    if (face === previous || (previous && before && sameAxis(face, previous) && sameAxis(face, before))) continue;
    moves.push(face + SUFFIXES[randomInt(SUFFIXES.length)]);
  }
  return moves.join(" ");
}

export function effectiveCompetitionTime(result: CompetitionResultValue) { return result.penalty === "DNF" ? null : result.elapsedMs + (result.penalty === "+2" ? 2_000 : 0); }

/** WCA-style average: drop the fastest and slowest; two DNFs make the average DNF. */
export function competitionAverage(results: CompetitionResultValue[], count: number) {
  if (results.length < count) return undefined;
  const values = results.slice(-count).map(effectiveCompetitionTime);
  if (values.filter((value) => value === null).length >= 2) return null;
  const sorted = values.map((value) => value ?? Number.POSITIVE_INFINITY).sort((left, right) => left - right);
  const counted = sorted.slice(1, -1);
  return counted.some((value) => !Number.isFinite(value)) ? null : counted.reduce((total, value) => total + value, 0) / counted.length;
}

export function competitionAo5(results: CompetitionResultValue[]) { return competitionAverage(results, 5); }
export function competitionAo12(results: CompetitionResultValue[]) { return competitionAverage(results, 12); }
export function competitionBestOf3(results: CompetitionResultValue[]) {
  if (results.length < 3) return undefined;
  const values = results.slice(-3).map(effectiveCompetitionTime).filter((value): value is number => value !== null);
  return values.length ? Math.min(...values) : null;
}
export function competitionFormatScore(format: CompetitionFormat, results: CompetitionResultValue[]) { return format === "best_of_3" ? competitionBestOf3(results) : format === "ao12" ? competitionAo12(results) : competitionAo5(results); }
export function competitionRoundLimit(format: CompetitionFormat) { return format === "best_of_3" ? 3 : format === "ao12" ? 12 : 5; }
