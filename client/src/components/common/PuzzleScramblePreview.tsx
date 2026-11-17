import { lazy, Suspense, useMemo } from "react";
import { isSideEvent2DPuzzle } from "@/features/puzzle-3d/lib/puzzleIds";
import { timerPreviewPuzzleId, type TimerEventId } from "@/lib/timerEvents";

const Puzzle3DCanvas = lazy(async () => ({
  default: (await import("@/features/puzzle-3d/components/Puzzle3DCanvas"))
    .Puzzle3DCanvas,
}));

export function puzzleScramblePreviewConfig(
  eventId: TimerEventId,
  scramble: string
) {
  const puzzle = timerPreviewPuzzleId(eventId);
  return puzzle
    ? {
        puzzle,
        experimentalSetupAlg: scramble,
        alg: "",
        visualization: isSideEvent2DPuzzle(puzzle)
          ? ("2D" as const)
          : ("3D" as const),
        hintFacelets: "none" as const,
        controlPanel: "none" as const,
        backView: "none" as const,
        background: "none" as const,
      }
    : null;
}

/** Every preview opens the external Cubing/Three canvas chunk. */
export function previewNeedsExternal3DModule(eventId: TimerEventId) {
  return Boolean(timerPreviewPuzzleId(eventId));
}

export function PuzzleScramblePreview({
  eventId,
  scramble,
  language,
  animationAlg,
  animationRunId,
  focusFtoWhiteFace,
  focusFtoFace,
}: {
  eventId: TimerEventId;
  scramble: string;
  language: "vi" | "en";
  animationAlg?: string;
  animationRunId?: number;
  focusFtoWhiteFace?: boolean;
  focusFtoFace?: "white" | "orange";
}) {
  const config = useMemo(
    () => puzzleScramblePreviewConfig(eventId, scramble),
    [eventId, scramble]
  );

  if (!config) return null;
  const modelLabel = isSideEvent2DPuzzle(config.puzzle) ? "2D" : "3D";
  return (
    <Suspense
      fallback={
        <div className="rounded-card bg-surface h-full">
          <div className="p-5 sm:p-6 flex items-center justify-center text-sm text-muted">
            {language === "vi"
              ? `Đang tải mô hình ${modelLabel}…`
              : `Loading ${modelLabel} model…`}
          </div>
        </div>
      }
    >
      <Puzzle3DCanvas
        eventId={eventId}
        puzzle={config.puzzle}
        scramble={scramble}
        language={language}
        animationAlg={animationAlg}
        animationRunId={animationRunId}
        focusFtoWhiteFace={focusFtoWhiteFace}
        focusFtoFace={focusFtoFace}
      />
    </Suspense>
  );
}
