/**
 * The single spaced-repetition interval ladder used by every drill in the
 * app (BLD memo review and the Last Layer practice queue).
 *
 * `prior` is the current interval in days (0 when there is no record yet).
 * `again` resets to 0; `hard` grows by 30 % (at least 1 day); `good` doubles
 * plus a half; `easy` multiplies by 3.5 (starting at 3 days).
 */
export type SpacedRepetitionGrade = "again" | "hard" | "good" | "easy";

export function spacedRepetitionInterval(
  prior: number,
  grade: SpacedRepetitionGrade
): number {
  if (grade === "again") return 0;
  if (grade === "hard") return Math.max(1, Math.round(Math.max(1, prior) * 1.3));
  if (grade === "good") return prior < 1 ? 1 : Math.round(prior * 2.5);
  return prior < 1 ? 3 : Math.round(prior * 3.5);
}
