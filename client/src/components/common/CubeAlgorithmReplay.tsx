/**
 * 3D replay of a case's algorithm for the catalog preview dialog: builds the
 * case from its inverse (`setupAlg`) and plays the algorithm forward on a
 * shared Cubing.js 3D canvas — the same Setup → Alg flow the practice cards
 * use. `replayToken` bumps retrigger the build so the dialog's "Xem lại"
 * button restarts the animation on demand.
 */
import { lazy, Suspense } from "react";
import type { TimerEventId } from "@/lib/timerEvents";
import type { PuzzleId } from "@/features/puzzle-3d/lib/puzzleIds";

const Puzzle3DCanvas = lazy(async () => ({
  default: (await import("@/features/puzzle-3d/components/Puzzle3DCanvas"))
    .Puzzle3DCanvas,
}));

export function CubeAlgorithmReplay({
  eventId,
  puzzle,
  scramble,
  algorithm,
  language,
  replayToken,
}: {
  eventId: TimerEventId;
  puzzle: PuzzleId;
  /** The case, ready for cubing.js (e.g. the lane's scrambleOf helper). */
  scramble: string;
  /** The (M→ slices pre-converted) algorithm to play on top of the case. */
  algorithm: string;
  language: "vi" | "en";
  /** Bump to restart the animation (dialog "Xem lại" button). */
  replayToken?: number;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center text-sm text-muted">
          {language === "vi" ? "Đang tải mô hình 3D…" : "Loading 3D model…"}
        </div>
      }
    >
      <Puzzle3DCanvas
        eventId={eventId}
        puzzle={puzzle}
        scramble={scramble}
        language={language}
        animationAlg={algorithm}
        animationRunId={replayToken}
      />
    </Suspense>
  );
}
