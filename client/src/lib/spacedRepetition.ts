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
