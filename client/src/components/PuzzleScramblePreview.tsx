import { useMemo } from "react";
import { Cube3DGuide } from "@/components/Cube3DGuide";
import { SOLVED_FAST_STATE, stateFromScramble } from "@/lib/fastCube";
import { timerPreviewPuzzleId, type TimerEventId } from "@/lib/timerEvents";
import { Puzzle3DCanvas } from "@/components/Puzzle3DCanvas";
import type { FtoTargetFocus } from "@/components/Puzzle3DCanvas";

export function puzzleScramblePreviewConfig(eventId: TimerEventId, scramble: string) {
  const puzzle = timerPreviewPuzzleId(eventId);
  return puzzle ? { puzzle, experimentalSetupAlg: scramble, alg: "", visualization: "3D" as const, hintFacelets: "none" as const, controlPanel: "none" as const, backView: "none" as const, background: "none" as const } : null;
}

export function PuzzleScramblePreview({ eventId, scramble, language, targetFocus }: { eventId: TimerEventId; scramble: string; language: "vi" | "en"; targetFocus?: FtoTargetFocus }) {
  const config = useMemo(() => puzzleScramblePreviewConfig(eventId, scramble), [eventId, scramble]);
  const twoByTwoState = useMemo(() => { if (eventId !== "222") return SOLVED_FAST_STATE; try { return stateFromScramble(scramble); } catch { return SOLVED_FAST_STATE; } }, [eventId, scramble]);

  if (eventId === "222") return <Cube3DGuide state={twoByTwoState} dimension={2} step={0} />;
  return config && config.puzzle !== "2x2x2" ? <Puzzle3DCanvas eventId={eventId} puzzle={config.puzzle} scramble={scramble} language={language} targetFocus={config.puzzle === "fto" ? targetFocus : undefined} /> : null;
}
