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
  tempoScale,
  model3d,
}: {
  eventId: TimerEventId;
  puzzle: PuzzleId;
  scramble: string;
  algorithm: string;
  language: "vi" | "en";
  replayToken?: number;
  tempoScale?: number;
  model3d?: boolean;
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
        tempoScale={tempoScale}
        model3d={model3d}
      />
    </Suspense>
  );
}
