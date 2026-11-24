import { SOLVED_FAST_STATE, stateFromScramble } from "@/lib/fastCube";
import { normalizeTimerEventId } from "@/lib/timerEvents";
import { readSolverSettings } from "@/lib/appSettings";
import { orientForCross, scrambledState, wcaLettersToStudio } from "@/lib/scrambleOrientation";

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
