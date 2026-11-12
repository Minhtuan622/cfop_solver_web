/**
 * Soft Focus Workspace — physical layer-turns accelerate, lock into place, then settle;
 * drag orbit remains direct with no transition lag and Cube 3D is the only rich motion.
 */
import { Rotate3D } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/StudioUI";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type TouchEvent,
  type WheelEvent,
} from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CUBE_COLORS as color } from "@/features/puzzle-3d/lib/cubeColors";
const faceOffset: Record<"U" | "R" | "F" | "D" | "L" | "B", number> = {
  U: 0,
  R: 9,
  F: 18,
  D: 27,
  L: 36,
  B: 45,
};
const DEFAULT_CAMERA = { orbit: 0, pitch: 0, zoom: 1 };
const DISPLAY_SCALE = 1.25;
// The display state already places the selected Cross on D. Keep the camera
// square to that axis at rest; users can reveal depth with their own drag.
const DEFAULT_ORIENTATION = "rotateX(0deg) rotateY(0deg)";
const DRAG_THRESHOLD_PX = 7;
const TOUCH_DRAG_THRESHOLD_PX = 14;
const TOUCH_HOLD_TO_ORBIT_MS = 180;
const clampPitch = (degrees: number) => Math.max(-72, Math.min(64, degrees));
const INERTIA_DECAY = 0.92;
const INERTIA_STOP = 0.025;
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
const DISPLAY_FACE: Record<string, Record<string, string>> = {
  U: { U: "D", R: "L", F: "B", D: "U", L: "R", B: "F" },
  D: { U: "U", R: "R", F: "F", D: "D", L: "L", B: "B" },
  F: { U: "F", R: "R", F: "D", D: "B", L: "L", B: "U" },
  B: { U: "B", R: "R", F: "U", D: "F", L: "L", B: "D" },
  R: { U: "R", R: "D", F: "F", D: "L", L: "U", B: "B" },
  L: { U: "L", R: "U", F: "F", D: "R", L: "D", B: "B" },
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

const LAYER_STRIPS: Record<
  "U" | "R" | "F" | "D" | "L" | "B",
  { face: "U" | "R" | "F" | "D" | "L" | "B"; cells: number[] }[]
> = {
  R: [
    { face: "F", cells: [2, 5, 8] },
    { face: "U", cells: [2, 5, 8] },
    { face: "B", cells: [0, 3, 6] },
    { face: "D", cells: [2, 5, 8] },
  ],
  L: [
    { face: "F", cells: [0, 3, 6] },
    { face: "U", cells: [0, 3, 6] },
    { face: "B", cells: [2, 5, 8] },
    { face: "D", cells: [0, 3, 6] },
  ],
  U: [
    { face: "F", cells: [0, 1, 2] },
    { face: "R", cells: [0, 1, 2] },
    { face: "B", cells: [0, 1, 2] },
    { face: "L", cells: [0, 1, 2] },
  ],
  D: [
    { face: "F", cells: [6, 7, 8] },
    { face: "R", cells: [6, 7, 8] },
    { face: "B", cells: [6, 7, 8] },
    { face: "L", cells: [6, 7, 8] },
  ],
  F: [
    { face: "U", cells: [6, 7, 8] },
    { face: "R", cells: [0, 3, 6] },
    { face: "D", cells: [0, 1, 2] },
    { face: "L", cells: [2, 5, 8] },
  ],
  B: [
    { face: "U", cells: [0, 1, 2] },
    { face: "R", cells: [2, 5, 8] },
    { face: "D", cells: [6, 7, 8] },
    { face: "L", cells: [0, 3, 6] },
  ],
};

const F2L_SLOT_STICKERS: Record<
  string,
  Partial<Record<"U" | "R" | "F" | "D" | "L" | "B", number[]>>
> = {
  FR: { D: [2], F: [5, 8], R: [3, 6] },
  FL: { D: [0], F: [3, 6], L: [5, 8] },
  BL: { D: [6], B: [5, 8], L: [3, 6] },
  BR: { D: [8], B: [3, 6], R: [5, 8] },
};

const OPPOSITE_FACE: Record<string, "U" | "R" | "F" | "D" | "L" | "B"> = {
  U: "D",
  D: "U",
  F: "B",
  B: "F",
  R: "L",
  L: "R",
};
function lastLayerStickerMap(layer: "U" | "R" | "F" | "D" | "L" | "B") {
  const stickers: Partial<Record<"U" | "R" | "F" | "D" | "L" | "B", number[]>> =
    { [layer]: [0, 1, 2, 3, 4, 5, 6, 7, 8] };
  for (const strip of LAYER_STRIPS[layer]) stickers[strip.face] = strip.cells;
  return stickers;
}

function Face({
  face,
  state,
  dimension,
  inspectCross,
  crossColor,
  xcrossSlots,
  lastLayerCase,
  lastLayerStickers,
  specialStickers,
}: {
  face: "U" | "R" | "F" | "D" | "L" | "B";
  state: string;
  dimension: 2 | 3;
  inspectCross: boolean;
  crossColor: string;
  xcrossSlots?: string[];
  lastLayerCase?: { family: string; id: string };
  lastLayerStickers?: Partial<
    Record<"U" | "R" | "F" | "D" | "L" | "B", number[]>
  >;
  specialStickers?: Partial<
    Record<"U" | "R" | "F" | "D" | "L" | "B", number[]>
  >;
}) {
  const crossEdges = new Set([1, 3, 5, 7]);
  const stickerIndexes =
    dimension === 2
      ? [0, 2, 6, 8]
      : Array.from({ length: 9 }, (_, index) => index);
  return (
    <div
      className={`cube3d-face cube3d-${face.toLowerCase()}${dimension === 2 ? " cube3d-face-2x2" : ""}`}
    >
      {stickerIndexes.map(index => {
        const highlighted =
          inspectCross &&
          crossEdges.has(index) &&
          state[faceOffset[face] + index] === crossColor;
        const slotHighlighted = Boolean(
          xcrossSlots?.some(slot =>
            F2L_SLOT_STICKERS[slot]?.[face]?.includes(index)
          )
        );
        const lastLayerHighlighted = Boolean(
          lastLayerCase && lastLayerStickers?.[face]?.includes(index)
        );
        const specialHighlighted = Boolean(
          specialStickers?.[face]?.includes(index)
        );
        return (
          <span
            key={index}
            className={
              highlighted
                ? "cube3d-cross-sticker"
                : specialHighlighted
                  ? "cube3d-special-sticker"
                  : lastLayerHighlighted
                    ? "cube3d-last-layer-sticker"
                    : slotHighlighted
                      ? "cube3d-xcross-sticker"
                      : ""
            }
            style={{
              background: color[state[faceOffset[face] + index]] ?? "#777",
            }}
          />
        );
      })}
    </div>
  );
}

function LayerTurn({
  face,
  state,
  angle,
  step,
  move,
  duration,
}: {
  face: "U" | "R" | "F" | "D" | "L" | "B";
  state: string;
  angle: string;
  step: number;
  move?: string;
  duration: number;
}) {
  const sticker = (
    sourceFace: "U" | "R" | "F" | "D" | "L" | "B",
    index: number
  ) => (
    <span
      key={`${sourceFace}-${index}`}
      style={{
        background: color[state[faceOffset[sourceFace] + index]] ?? "#777",
      }}
    />
  );
  return (
    <div
      key={`${step}-${move}`}
      className={`cube3d-layer cube3d-layer-${face.toLowerCase()}`}
      style={
        {
          "--turn-angle": angle,
          "--turn-duration": `${duration}ms`,
        } as React.CSSProperties
      }
    >
      <div className="cube3d-layer-main">
        {Array.from({ length: 9 }, (_, index) => sticker(face, index))}
      </div>
      {LAYER_STRIPS[face].map((strip, index) => (
        <div
          key={`${strip.face}-${index}`}
          className={`cube3d-layer-strip cube3d-layer-strip-${strip.face.toLowerCase()}`}
        >
          {strip.cells.map(cell => sticker(strip.face, cell))}
        </div>
      ))}
    </div>
  );
}

export function Cube3DGuide({
  state,
  previousState,
  move,
  step,
  dimension = 3,
  crossColor = "U",
  inspection = false,
  alignCross = false,
  highlightCross = true,
  xcrossSlots,
  lastLayerCase,
  specialStickers,
  transition = "idle",
  transitionDirection = "forward",
  transitionId = 0,
  phaseLabel,
  turnDurationMs = 340,
  initialOrbit = 0,
  initialPitch = 0,
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
  const { language } = useLanguage();
  const [camera, setCamera] = useState(() => ({
    ...DEFAULT_CAMERA,
    orbit: initialOrbit,
    pitch: initialPitch,
  }));
  const [isOrbiting, setIsOrbiting] = useState(false);
  const drag = useRef<{
    x: number;
    y: number;
    orbit: number;
    pitch: number;
    lastX: number;
    lastY: number;
    lastAt: number;
    moved: boolean;
    startedAt: number;
    pointerType: string;
  } | null>(null);
  const pinch = useRef<number | null>(null);
  const inertiaFrame = useRef<number | null>(null);
  const inertiaVelocity = useRef({ orbit: 0, pitch: 0 });
  const activeInspection = highlightCross && inspection;
  const target = move?.[0] ?? "";
  const sourceMotionFace =
    (
      { M: "R", E: "U", S: "F", x: "R", y: "U", z: "F" } as Record<
        string,
        string
      >
    )[target] ?? target.toUpperCase();
  const motionFace = alignCross
    ? (DISPLAY_FACE[crossColor]?.[sourceMotionFace] ?? sourceMotionFace)
    : sourceMotionFace;
  const animateLayer = Boolean(target) && transition === "move";
  const renderedState = displayState(state, crossColor, alignCross);
  const renderedPreviousState = displayState(
    previousState ?? state,
    crossColor,
    alignCross
  );
  const originalLastLayerFace = OPPOSITE_FACE[crossColor] ?? "U";
  const displayLastLayerFace = alignCross
    ? (DISPLAY_FACE[crossColor]?.[originalLastLayerFace] ??
      originalLastLayerFace)
    : originalLastLayerFace;
  const lastLayerStickers = lastLayerCase
    ? lastLayerStickerMap(
        displayLastLayerFace as "U" | "R" | "F" | "D" | "L" | "B"
      )
    : undefined;
  const cancelInertia = () => {
    if (inertiaFrame.current !== null)
      cancelAnimationFrame(inertiaFrame.current);
    inertiaFrame.current = null;
    inertiaVelocity.current = { orbit: 0, pitch: 0 };
  };
  const startInertia = () => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const advance = () => {
      const velocity = inertiaVelocity.current;
      velocity.orbit *= INERTIA_DECAY;
      velocity.pitch *= INERTIA_DECAY;
      if (
        Math.abs(velocity.orbit) < INERTIA_STOP &&
        Math.abs(velocity.pitch) < INERTIA_STOP
      ) {
        cancelInertia();
        return;
      }
      setCamera(previous => ({
        ...previous,
        orbit: previous.orbit + velocity.orbit,
        pitch: clampPitch(previous.pitch + velocity.pitch),
      }));
      inertiaFrame.current = requestAnimationFrame(advance);
    };
    inertiaFrame.current = requestAnimationFrame(advance);
  };
  useEffect(
    () => () => {
      if (inertiaFrame.current !== null)
        cancelAnimationFrame(inertiaFrame.current);
    },
    []
  );
  const changeZoom = (amount: number) =>
    setCamera(previous => ({
      ...previous,
      zoom: Math.min(
        1.42,
        Math.max(0.78, Number((previous.zoom + amount).toFixed(2)))
      ),
    }));
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    cancelInertia();
    const now = performance.now();
    setIsOrbiting(false);
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      orbit: camera.orbit,
      pitch: camera.pitch,
      lastX: event.clientX,
      lastY: event.clientY,
      lastAt: now,
      moved: false,
      startedAt: now,
      pointerType: event.pointerType,
    };
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const activeDrag = drag.current;
    if (!activeDrag) return;
    if (activeDrag.pointerType === "mouse" && event.buttons === 0) {
      drag.current = null;
      return;
    }
    const pointerX = event.clientX;
    const pointerY = event.clientY;
    const deltaX = pointerX - activeDrag.x;
    const deltaY = pointerY - activeDrag.y;
    const threshold =
      activeDrag.pointerType === "touch"
        ? TOUCH_DRAG_THRESHOLD_PX
        : DRAG_THRESHOLD_PX;
    const heldLongEnough =
      activeDrag.pointerType !== "touch" ||
      performance.now() - activeDrag.startedAt >= TOUCH_HOLD_TO_ORBIT_MS;
    if (
      !activeDrag.moved &&
      (!heldLongEnough || Math.hypot(deltaX, deltaY) < threshold)
    )
      return;
    activeDrag.moved = true;
    setIsOrbiting(true);
    if (!event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.setPointerCapture(event.pointerId);
    const now = performance.now();
    const elapsed = Math.max(8, now - activeDrag.lastAt);
    inertiaVelocity.current = {
      orbit: ((pointerX - activeDrag.lastX) * 0.42 * 16) / elapsed,
      pitch: ((activeDrag.lastY - pointerY) * 0.38 * 16) / elapsed,
    };
    activeDrag.lastX = pointerX;
    activeDrag.lastY = pointerY;
    activeDrag.lastAt = now;
    setCamera(previous => ({
      ...previous,
      orbit: activeDrag.orbit + deltaX * 0.42,
      pitch: clampPitch(activeDrag.pitch - deltaY * 0.38),
    }));
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const wasDragged = drag.current?.moved;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current = null;
    setIsOrbiting(false);
    if (wasDragged) startInertia();
  };
  const pointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.buttons === 0) {
      drag.current = null;
      setIsOrbiting(false);
    }
  };
  const wheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    changeZoom(event.deltaY > 0 ? -0.08 : 0.08);
  };
  const touchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2)
      pinch.current = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );
  };
  const touchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2 || pinch.current === null) return;
    const distance = Math.hypot(
      event.touches[0].clientX - event.touches[1].clientX,
      event.touches[0].clientY - event.touches[1].clientY
    );
    changeZoom((distance - pinch.current) / 240);
    pinch.current = distance;
  };
  const reset = () => {
    cancelInertia();
    setIsOrbiting(false);
    setCamera(previous => ({
      ...previous,
      orbit: initialOrbit,
      pitch: initialPitch,
    }));
  };
  const displayZoom = camera.zoom * DISPLAY_SCALE;
  const transform = `rotateX(${camera.pitch}deg) rotateY(${camera.orbit}deg) ${DEFAULT_ORIENTATION} scale3d(${displayZoom}, ${displayZoom}, ${displayZoom})`;
  const turnAngle = move?.endsWith("2")
    ? "180deg"
    : move?.endsWith("'")
      ? "-90deg"
      : "90deg";
  const turnDuration = Math.round(
    turnDurationMs * (move?.endsWith("2") ? 1.22 : 1)
  );
  return (
    <div
      className={`w-full overflow-hidden rounded-card bg-surface ${ surface === "light" ? "" : "bg-ink" }`}
    >
      <div className="p-5 sm:p-6 px-4">
        <div
          className={`interactive-cube-stage ${isOrbiting ? "is-orbiting" : ""}`}
          aria-label={
            language === "vi"
              ? "Mô hình Rubik 3D, kéo ngang để xoay 360° và kéo dọc để xem mặt trên/dưới; pinch hoặc cuộn để phóng to"
              : "3D Rubik model, drag horizontally for 360° orbit and vertically to view top or bottom; pinch or scroll to zoom"
          }
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerUp}
          onPointerLeave={pointerLeave}
          onWheel={wheel}
          onTouchStart={touchStart}
          onTouchMove={touchMove}
        >
          <div className="cube3d-motion-shell">
            <div
              className="cube3d-model"
              style={
                {
                  "--cube-transform": transform,
                  transform,
                } as React.CSSProperties
              }
            >
              {(["F", "R", "U", "B", "L", "D"] as const).map(face => (
                <Face
                  key={`${step}-${move}-${face}`}
                  face={face}
                  state={renderedState}
                  dimension={dimension}
                  inspectCross={activeInspection}
                  crossColor={crossColor}
                  xcrossSlots={xcrossSlots}
                  lastLayerCase={lastLayerCase}
                  lastLayerStickers={lastLayerStickers}
                  specialStickers={specialStickers}
                />
              ))}
              {dimension === 3 && animateLayer && (
                <LayerTurn
                  face={motionFace as "U" | "R" | "F" | "D" | "L" | "B"}
                  state={renderedPreviousState}
                  angle={turnAngle}
                  step={step}
                  move={move}
                  duration={turnDuration}
                />
              )}
            </div>
          </div>
          {transition === "phase" && phaseLabel && (
            <div
              key={transitionId}
              className="text-sm text-ink"
              aria-live="polite"
            >
              <span>{language === "vi" ? "CHUYỂN PHA" : "PHASE SHIFT"}</span>
              <b>{phaseLabel}</b>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-2">
          <IconButton
            label={language === "vi" ? "Đặt lại góc nhìn 3D" : "Reset 3D view"}
            icon={<Rotate3D className="text-base" />}
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-white/10 text-white hover:bg-white/20 px-3 py-1.5 text-xs"
            title={language === "vi" ? "Đặt lại góc nhìn" : "Reset view"}
          />
        </div>
      </div>
    </div>
  );
}
