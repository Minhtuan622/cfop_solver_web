import { lazy, Suspense, useMemo } from "react";
import { Cube3DGuide } from "@/components/Cube3DGuide";
import { SOLVED_FAST_STATE, stateFromScramble } from "@/lib/fastCube";
import { timerPreviewPuzzleId, type TimerEventId } from "@/lib/timerEvents";

const Puzzle3DCanvas = lazy(async () => ({ default: (await import("@/components/Puzzle3DCanvas")).Puzzle3DCanvas }));

export function puzzleScramblePreviewConfig(eventId: TimerEventId, scramble: string) {
  const puzzle = timerPreviewPuzzleId(eventId);
  return puzzle ? { puzzle, experimentalSetupAlg: scramble, alg: "", visualization: "3D" as const, hintFacelets: "none" as const, controlPanel: "none" as const, backView: "none" as const, background: "none" as const } : null;
}

/** Standard 2×2/3×3 previews are CSS-based; only these events open the external Cubing/Three canvas chunk. */
export function previewNeedsExternal3DModule(eventId: TimerEventId) {
  const puzzle = timerPreviewPuzzleId(eventId);
  return Boolean(puzzle && puzzle !== "2x2x2");
}

export function PuzzleScramblePreview({ eventId, scramble, language, animationAlg, animationRunId, focusFtoWhiteFace, focusFtoFace }: { eventId: TimerEventId; scramble: string; language: "vi" | "en"; animationAlg?: string; animationRunId?: number; focusFtoWhiteFace?: boolean; focusFtoFace?: "white" | "orange" }) {
  const config = useMemo(() => puzzleScramblePreviewConfig(eventId, scramble), [eventId, scramble]);
  const twoByTwoState = useMemo(() => { if (eventId !== "222") return SOLVED_FAST_STATE; try { return stateFromScramble(scramble); } catch { return SOLVED_FAST_STATE; } }, [eventId, scramble]);

  if (eventId === "222") return <Cube3DGuide state={twoByTwoState} dimension={2} step={0} />;
  return config && config.puzzle !== "2x2x2" ? <Suspense fallback={<div className="card bg-dark text-white h-100"><div className="card-body d-flex align-items-center justify-content-center small text-white-50">{language === "vi" ? "Đang tải mô hình 3D…" : "Loading 3D model…"}</div></div>}><Puzzle3DCanvas eventId={eventId} puzzle={config.puzzle} scramble={scramble} language={language} animationAlg={animationAlg} animationRunId={animationRunId} focusFtoWhiteFace={focusFtoWhiteFace} focusFtoFace={focusFtoFace} /></Suspense> : null;
}
