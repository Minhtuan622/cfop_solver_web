import { formatSolveTime } from "@/lib/solveHistory";
import type { Language } from "@/contexts/LanguageContext";
import type { Translate } from "@/lib/i18n";

export function formatDate(value: Date | string, language: Language) {
  return new Date(value).toLocaleString(language === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function playerScoreLabel(
  score: number | null | undefined,
  eventId: string,
  t: Translate
) {
  if (eventId === "333mbf")
    return typeof score === "number"
      ? t("competition.points", { points: score })
      : "DNF";
  return typeof score === "number" ? formatSolveTime(score) : "DNF";
}
