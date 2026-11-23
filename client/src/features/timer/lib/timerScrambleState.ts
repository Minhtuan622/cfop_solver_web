/** Trạng thái khối sau khi tráo, dùng cho hình xem trước và ảnh export của trang Bấm giờ. */
import { SOLVED_FAST_STATE, stateFromScramble } from "@/lib/fastCube";
import { normalizeTimerEventId } from "@/lib/timerEvents";
import { readSolverSettings } from "@/lib/appSettings";
import { orientForCross, scrambledState, wcaLettersToStudio } from "@/lib/scrambleOrientation";

/**
 * Khối sau khi tráo, cầm trắng U, xanh lá F. 3×3 thường: lật màu cross trong
 * Cài đặt về D. BLD: giữ nguyên hướng tráo (người giải mù không lật khối).
 */
export function safeScrambleState(scramble: string, eventId?: string) {
  try {
    const event = normalizeTimerEventId(eventId);
    return event === "333bf" || event === "333mbf"
      ? wcaLettersToStudio(stateFromScramble(scramble))
      : orientForCross(
          scrambledState(scramble),
          readSolverSettings().crossColor
        );
  } catch {
    return SOLVED_FAST_STATE;
  }
}
