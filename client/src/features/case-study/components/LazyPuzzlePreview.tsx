import { lazy, Suspense, type ComponentProps } from "react";
import type { Puzzle3DCanvas as Puzzle3DCanvasComponent } from "@/features/puzzle-3d/components/Puzzle3DCanvas";

const Puzzle3DCanvas = lazy(async () => ({
  default: (await import("@/features/puzzle-3d/components/Puzzle3DCanvas"))
    .Puzzle3DCanvas,
}));

export type LazyPuzzlePreviewProps = Pick<
  ComponentProps<typeof Puzzle3DCanvasComponent>,
  "eventId" | "puzzle" | "scramble" | "language"
> & {
  loadingLabel: string;
  frameClassName?: string;
};

export function LazyPuzzlePreview({
  eventId,
  puzzle,
  scramble,
  language,
  loadingLabel,
  frameClassName = "relative overflow-hidden rounded-xl bg-surface-2",
}: LazyPuzzlePreviewProps) {
  return (
    <div className={frameClassName}>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center text-sm text-muted">
            {loadingLabel}
          </div>
        }
      >
        <Puzzle3DCanvas
          eventId={eventId}
          puzzle={puzzle}
          scramble={scramble}
          language={language}
        />
      </Suspense>
    </div>
  );
}
