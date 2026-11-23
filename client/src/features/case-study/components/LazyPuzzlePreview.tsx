import { lazy, Suspense, type ComponentProps } from "react";
import type { Puzzle3DCanvas as Puzzle3DCanvasComponent } from "@/features/puzzle-3d/components/Puzzle3DCanvas";

// Import động trỏ module cụ thể (không trỏ barrel) để Three.js/Cubing nằm ở
// chunk riêng; `e2e/lazy-3d-loading.spec.ts` khoá ranh giới này.
const Puzzle3DCanvas = lazy(async () => ({
  default: (await import("@/features/puzzle-3d/components/Puzzle3DCanvas"))
    .Puzzle3DCanvas,
}));

export type LazyPuzzlePreviewProps = Pick<
  ComponentProps<typeof Puzzle3DCanvasComponent>,
  "eventId" | "puzzle" | "scramble" | "language"
> & {
  /** Chữ hiển thị trong lúc tải chunk 3D. */
  loadingLabel: string;
  /** Class của khung bao quanh canvas. */
  frameClassName?: string;
};

/** Khung xem case 3D của các lane luyện tập, tải canvas khi cần. */
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
