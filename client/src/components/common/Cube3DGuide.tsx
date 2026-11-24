import { Suspense, lazy } from "react";

const CubeGuide3D = lazy(() =>
  import("@/features/puzzle-3d/components/CubeGuide3D").then(module => ({
    default: module.CubeGuide3D,
  }))
);

export function Cube3DGuide({
  state,
  previousState,
  move,
  dimension = 3,
  transition = "idle",
  phaseLabel,
  initialOrbit = 0.55,
  initialPitch = 0.3,
  surface = "dark",
  stageHeight,
  turnDurationMs = 340,
  orbitKeys = false,
}: {
  state: string;
  previousState?: string;
  move?: string;
  step: number;
  dimension?: 2 | 3;
  transition?: "idle" | "move" | "seek" | "phase" | "reset";
  transitionDirection?: "forward" | "backward";
  transitionId?: number;
  phaseLabel?: string;
  turnDurationMs?: number;
  orbitKeys?: boolean;
  initialOrbit?: number;
  initialPitch?: number;
  surface?: "dark" | "light";
  stageHeight?: number;
}) {
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
              surface={surface}
              initialYaw={initialOrbit || 0.55}
              initialPitch={initialPitch || 0.3}
              orbitKeys={orbitKeys}
              stageHeight={stageHeight}
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
