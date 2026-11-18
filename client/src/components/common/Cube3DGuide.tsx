/**
 * Soft Focus Workspace — physical layer-turns accelerate, lock into place, then settle;
 * drag orbit remains direct with no transition lag and Cube 3D is the only rich motion.
 *
 * The 3D renderer is shared with the side-event puzzles (`CubeGuide3D`): rounded
 * cubies on a Three.js stage with the same camera/light feel as THREE-based events.
 */
import { Suspense, lazy } from "react";

const CubeGuide3D = lazy(() =>
  import("@/features/puzzle-3d/components/CubeGuide3D").then(module => ({
    default: module.CubeGuide3D,
  }))
);

/**
 * The display state keeps the raw facelets; the 3D renderer aligns the Cross
 * to D with a fixed whole-scene rotation (`alignCross`). Animations always
 * run in the same frame as the state, so moves rotate the layers the user
 * actually sees.
 */
export function Cube3DGuide({
  state,
  previousState,
  move,
  dimension = 3,
  crossColor = "U",
  inspection = false,
  alignCross = false,
  highlightCross = true,
  xcrossSlots,
  lastLayerCase,
  specialStickers,
  transition = "idle",
  phaseLabel,
  initialOrbit = 0.55,
  initialPitch = 0.3,
  surface = "dark",
  turnDurationMs = 340,
  orbitKeys = false,
}: {
  state: string;
  previousState?: string;
  move?: string;
  step: number;
  dimension?: 2 | 3;
  crossColor?: string;
  inspection?: boolean;
  alignCross?: boolean;
  highlightCross?: boolean;
  xcrossSlots?: string[];
  lastLayerCase?: { family: string; id: string };
  specialStickers?: Partial<
    Record<"U" | "R" | "F" | "D" | "L" | "B", number[]>
  >;
  transition?: "idle" | "move" | "seek" | "phase" | "reset";
  transitionDirection?: "forward" | "backward";
  transitionId?: number;
  phaseLabel?: string;
  turnDurationMs?: number;
  orbitKeys?: boolean;
  initialOrbit?: number;
  initialPitch?: number;
  surface?: "dark" | "light";
}) {
  const activeInspection = highlightCross && inspection;

  return (
    <div
      className={`w-full overflow-hidden rounded-card bg-surface ${
        surface === "light" ? "" : "bg-ink"
      }`}
    >
      <div className="p-5 sm:p-6 px-4">
        <div className="relative">
          <Suspense
            fallback={
              <div className="grid min-h-84 place-items-center rounded-card bg-surface-2 text-sm text-muted">
                Đang dựng mô hình 3D…
              </div>
            }
          >
            <CubeGuide3D
              state={state}
              previousState={previousState}
              move={move}
              transition={transition}
              turnDurationMs={turnDurationMs}
              dimension={dimension}
              inspectCross={activeInspection}
              crossColor={crossColor}
              alignCross={alignCross}
              xcrossSlots={xcrossSlots}
              lastLayerCase={lastLayerCase ?? null}
              specialStickers={specialStickers}
              surface={surface}
              initialYaw={initialOrbit || 0.55}
              initialPitch={initialPitch || 0.3}
              orbitKeys={orbitKeys}
            />
          </Suspense>
          {transition === "phase" && phaseLabel ? (
            <div
              aria-live="polite"
              className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-primary/90 px-4 py-1 text-xs font-semibold text-on-primary"
            >
              {phaseLabel}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
