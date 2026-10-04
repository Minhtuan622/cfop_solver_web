import { randomInt } from "node:crypto";
import type { TimerEventId } from "../shared/timerEvents";
import { compareMultiBlindResults, multiBlindResult, type MultiBlindResult } from "../shared/multiBlind";

const FACES = ["U", "R", "F", "D", "L", "B"] as const;
const SUFFIXES = ["", "2", "'"] as const;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type CompetitionPenalty = "none" | "+2" | "DNF";
export type CompetitionResultValue = { elapsedMs: number; penalty: CompetitionPenalty; multiBlindScore?: number | null; multiBlindAttempted?: number | null; multiBlindSolved?: number | null };
export type CompetitionFormat = "best_of_3" | "ao5" | "ao12";
export type CompetitionLeaderboardResult = CompetitionResultValue & { roomId: number; roomFormat: CompetitionFormat; roomEventId: string; accountId: number; displayName: string; avatarUrl: string | null; roundSequence: number };

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

/** Every room round follows the exact same event scramble semantics as Timer. */
export async function createCompetitionScramble(eventId: TimerEventId) {
  const { randomScrambleForEvent } = await import("cubing/scramble");
  return (await randomScrambleForEvent(eventId)).toString();
}

export async function createCompetitionScrambleBundle(eventId: TimerEventId, cubeCount = 1) {
  const count = eventId === "333mbf" ? Math.max(2, Math.min(99, Math.floor(cubeCount))) : 1;
  return Promise.all(Array.from({ length: count }, () => createCompetitionScramble(eventId === "333mbf" ? "333" : eventId)));
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
export function competitionFormatScore(format: CompetitionFormat, results: CompetitionResultValue[], eventId = "333") {
  if (eventId === "333mbf") return results.at(-1)?.penalty === "DNF" ? null : results.at(-1)?.multiBlindScore ?? null;
  return format === "best_of_3" ? competitionBestOf3(results) : format === "ao12" ? competitionAo12(results) : competitionAo5(results);
}
export function competitionRoundLimit(format: CompetitionFormat, eventId = "333") { return eventId === "333mbf" ? 1 : format === "best_of_3" ? 3 : format === "ao12" ? 12 : 5; }

function multiBlindData(result: CompetitionResultValue): MultiBlindResult | null {
  if (typeof result.multiBlindAttempted !== "number" || typeof result.multiBlindSolved !== "number") return null;
  return multiBlindResult({ attempted: result.multiBlindAttempted, solved: result.multiBlindSolved }, result.elapsedMs);
}

export function compareCompetitionResults(eventId: string, left: CompetitionResultValue, right: CompetitionResultValue) {
  if (eventId === "333mbf") {
    const leftMultiBlind = multiBlindData(left);
    const rightMultiBlind = multiBlindData(right);
    if (!leftMultiBlind?.valid) return 1;
    if (!rightMultiBlind?.valid) return -1;
    return compareMultiBlindResults(leftMultiBlind, rightMultiBlind, left.elapsedMs, right.elapsedMs);
  }
  return (effectiveCompetitionTime(left) ?? Number.POSITIVE_INFINITY) - (effectiveCompetitionTime(right) ?? Number.POSITIVE_INFINITY);
}

/** Aggregates only completed rooms with at least two scored players. Points reward final room placement. */
export function buildCompetitionLeaderboard(results: CompetitionLeaderboardResult[]) {
  const roomResults = new Map<number, CompetitionLeaderboardResult[]>();
  for (const result of results) roomResults.set(result.roomId, [...(roomResults.get(result.roomId) ?? []), result]);
  const totals = new Map<number, { accountId: number; displayName: string; avatarUrl: string | null; points: number; wins: number; rooms: number }>();
  for (const room of Array.from(roomResults.values())) {
    const players = new Map<number, CompetitionLeaderboardResult[]>();
    for (const result of room) players.set(result.accountId, [...(players.get(result.accountId) ?? []), result]);
    const scored = Array.from(players.entries()).map(([accountId, history]) => {
      const format = history[0].roomFormat;
      const eventId = history[0].roomEventId;
      const metric = competitionFormatScore(format, history, eventId);
      const last = history.at(-1);
      const score = metric === undefined ? (last ? effectiveCompetitionTime(last) : null) : metric;
      return { accountId, displayName: history[0].displayName, avatarUrl: history[0].avatarUrl, score, last, eventId };
    }).sort((left, right) => left.last && right.last ? compareCompetitionResults(left.eventId, left.last, right.last) : 0);
    if (scored.length < 2) continue;
    const roomPoints = [10, 6, 4, 3, 2, 1];
    scored.forEach((player, index) => {
      const current = totals.get(player.accountId) ?? { accountId: player.accountId, displayName: player.displayName, avatarUrl: player.avatarUrl, points: 0, wins: 0, rooms: 0 };
      current.points += roomPoints[index] ?? 1;
      current.wins += index === 0 ? 1 : 0;
      current.rooms += 1;
      totals.set(player.accountId, current);
    });
  }
  return Array.from(totals.values()).sort((left, right) => right.points - left.points || right.wins - left.wins || right.rooms - left.rooms || left.displayName.localeCompare(right.displayName)).map((player, index) => ({ ...player, rank: index + 1 }));
}
