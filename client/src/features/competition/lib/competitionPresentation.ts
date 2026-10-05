import { formatMultiBlindTime } from "@/lib/multiBlind";
import { formatSolveTime } from "@/lib/solveHistory";
import { DEFAULT_TIMER_EVENT, isTimerEventId, timerEventLabel } from "@/lib/timerEvents";

export type RoomFormat = "best_of_3" | "ao5" | "ao12";
export type CompetitionPenalty = "none" | "+2" | "DNF";

export const formatLabels: Record<RoomFormat, string> = { best_of_3: "Best of 3", ao5: "Ao5", ao12: "Ao12" };
export const formatDescriptions: Record<RoomFormat, string> = {
  best_of_3: "3 lượt · lấy single tốt nhất",
  ao5: "5 lượt · bỏ nhanh nhất và chậm nhất",
  ao12: "12 lượt · bỏ nhanh nhất và chậm nhất",
};

export function competitionErrorText(error: unknown) {
  return error instanceof Error ? error.message : "Không thể hoàn tất thao tác.";
}

export function competitionEventLabel(value: unknown) {
  return timerEventLabel(isTimerEventId(value) ? value : DEFAULT_TIMER_EVENT, "vi");
}

export function competitionResultLabel(result: { elapsedMs: number; penalty: CompetitionPenalty; multiBlindScore?: number | null } | null | undefined, eventId: unknown) {
  if (!result || result.penalty === "DNF") return result ? "DNF" : "—";
  if (eventId === "333mbf" && typeof result.multiBlindScore === "number") return `${result.multiBlindScore} điểm · ${formatMultiBlindTime(result.elapsedMs)}`;
  return `${formatSolveTime(result.elapsedMs + (result.penalty === "+2" ? 2_000 : 0))}${result.penalty === "+2" ? " +2" : ""}`;
}
