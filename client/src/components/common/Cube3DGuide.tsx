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

// The display state already places the selected Cross on D. Keep the camera
// square to that axis at rest; users can reveal depth with their own drag.
// These permutations come directly from the solver's whole-cube x/z moves.
// We rotate stickers into Cross=D display space, never the CSS cube itself.
const WHOLE_CUBE_PERM: Record<string, number[]> = {
  x: [
    53, 52, 51, 50, 49, 48, 47, 46, 45, 11, 14, 17, 10, 13, 16, 9, 12, 15, 0, 1,
    2, 3, 4, 5, 6, 7, 8, 18, 19, 20, 21, 22, 23, 24, 25, 26, 42, 39, 36, 43, 40,
    37, 44, 41, 38, 35, 34, 33, 32, 31, 30, 29, 28, 27,
  ],
  "x'": [
    18, 19, 20, 21, 22, 23, 24, 25, 26, 15, 12, 9, 16, 13, 10, 17, 14, 11, 27,
    28, 29, 30, 31, 32, 33, 34, 35, 53, 52, 51, 50, 49, 48, 47, 46, 45, 38, 41,
    44, 37, 40, 43, 36, 39, 42, 8, 7, 6, 5, 4, 3, 2, 1, 0,
  ],
  x2: [
    27, 28, 29, 30, 31, 32, 33, 34, 35, 17, 16, 15, 14, 13, 12, 11, 10, 9, 53,
    52, 51, 50, 49, 48, 47, 46, 45, 0, 1, 2, 3, 4, 5, 6, 7, 8, 44, 43, 42, 41,
    40, 39, 38, 37, 36, 26, 25, 24, 23, 22, 21, 20, 19, 18,
  ],
  z: [
    11, 14, 17, 10, 13, 16, 9, 12, 15, 29, 32, 35, 28, 31, 34, 27, 30, 33, 20,
    23, 26, 19, 22, 25, 18, 21, 24, 38, 41, 44, 37, 40, 43, 36, 39, 42, 2, 5, 8,
    1, 4, 7, 0, 3, 6, 51, 48, 45, 52, 49, 46, 53, 50, 47,
  ],
  "z'": [
    42, 39, 36, 43, 40, 37, 44, 41, 38, 6, 3, 0, 7, 4, 1, 8, 5, 2, 24, 21, 18,
    25, 22, 19, 26, 23, 20, 15, 12, 9, 16, 13, 10, 17, 14, 11, 33, 30, 27, 34,
    31, 28, 35, 32, 29, 47, 50, 53, 46, 49, 52, 45, 48, 51,
  ],
};
const CROSS_TO_DOWN_MOVES: Record<string, string[]> = {
  U: ["x2"],
  D: [],
  F: ["x'"],
  B: ["x"],
  R: ["z"],
  L: ["z'"],
};
function permuteState(state: string, permutation: number[]) {
  const out = Array.from({ length: 54 }, () => "?");
  for (let source = 0; source < 54; source += 1)
    out[permutation[source]] = state[source];
  return out.join("");
}

function displayState(state: string, crossColor: string, alignCross: boolean) {
  return alignCross
    ? (CROSS_TO_DOWN_MOVES[crossColor] ?? []).reduce(
        (current, move) => permuteState(current, WHOLE_CUBE_PERM[move]),
        state
      )
    : state;
}

export function Cube3DGuide({
  state,
  previousState,
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
  initialOrbit?: number;
  initialPitch?: number;
  surface?: "dark" | "light";
}) {
  const activeInspection = highlightCross && inspection;
  const renderedState = displayState(state, crossColor, alignCross);
  const renderedPrevious = displayState(
    previousState ?? state,
    crossColor,
    alignCross
  );

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
              state={renderedState}
              previousState={renderedPrevious}
              dimension={dimension}
              inspectCross={activeInspection}
              crossColor="U"
              xcrossSlots={xcrossSlots}
              lastLayerCase={lastLayerCase ?? null}
              specialStickers={specialStickers}
              surface={surface}
              initialYaw={initialOrbit || 0.55}
              initialPitch={initialPitch || 0.3}
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
