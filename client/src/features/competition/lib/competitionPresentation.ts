import { formatMultiBlindTime } from "@/lib/multiBlind";
import { formatSolveTime } from "@/lib/solveHistory";
import { DEFAULT_TIMER_EVENT, isTimerEventId, timerEventLabel } from "@/lib/timerEvents";
import { errorMessage } from "@/lib/apiError";
import type { Language, Translate } from "@/lib/i18n";

export type RoomFormat = "best_of_3" | "ao5" | "ao12";
export type CompetitionPenalty = "none" | "+2" | "DNF";

export const formatLabels: Record<RoomFormat, string> = { best_of_3: "Best of 3", ao5: "Ao5", ao12: "Ao12" };

/** Dictionary key of the scoring rule behind each format. */
export const formatDescriptionKey: Record<RoomFormat, string> = {
  best_of_3: "competition.format.bestOf3Description",
  ao5: "competition.format.ao5Description",
  ao12: "competition.format.ao12Description",
};

export function competitionErrorText(error: unknown, t: Translate) {
  return errorMessage(error, t);
}

export function competitionEventLabel(value: unknown, language: Language) {
  return timerEventLabel(isTimerEventId(value) ? value : DEFAULT_TIMER_EVENT, language);
}

export function competitionResultLabel(
  result: { elapsedMs: number; penalty: CompetitionPenalty; multiBlindScore?: number | null } | null | undefined,
  eventId: unknown,
  t: Translate,
) {
  if (!result || result.penalty === "DNF") return result ? "DNF" : "—";
  if (eventId === "333mbf" && typeof result.multiBlindScore === "number") {
    return t("competition.score", { score: result.multiBlindScore, time: formatMultiBlindTime(result.elapsedMs) });
  }
  return `${formatSolveTime(result.elapsedMs + (result.penalty === "+2" ? 2_000 : 0))}${result.penalty === "+2" ? " +2" : ""}`;
}
