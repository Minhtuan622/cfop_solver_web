/**
 * Xưởng Cơ Khí Tốc Độ — the cube moves like a physical layer-turn instrument:
 * short mechanical turns for adjacent moves and a mint relay slate for phase jumps.
 */
import { Rotate3D } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent, type TouchEvent, type WheelEvent } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const color: Record<string, string> = { U: "#f7f3e9", R: "#d95743", F: "#1ba77a", D: "#e7c34f", L: "#ed8e42", B: "#3b6fc7" };
const faceOffset: Record<"U" | "R" | "F" | "D" | "L" | "B", number> = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };
const DEFAULT_VIEW = { pitch: -26, yaw: 34, roll: 0, zoom: 1 };
const DRAG_THRESHOLD_PX = 7;
const TOUCH_DRAG_THRESHOLD_PX = 14;
const TOUCH_HOLD_TO_ORBIT_MS = 180;
const CROSS_DOWN_VIEW: Record<string, typeof DEFAULT_VIEW> = {
  U: { pitch: 154, yaw: 34, roll: 0, zoom: 1 },
  D: DEFAULT_VIEW,
  F: { pitch: -116, yaw: 34, roll: 0, zoom: 1 },
  B: { pitch: 64, yaw: 34, roll: 0, zoom: 1 },
  R: { pitch: -26, yaw: 34, roll: -90, zoom: 1 },
  L: { pitch: -26, yaw: 34, roll: 90, zoom: 1 },
};

const LAYER_STRIPS: Record<"U" | "R" | "F" | "D" | "L" | "B", { face: "U" | "R" | "F" | "D" | "L" | "B"; cells: number[] }[]> = {
  R: [{ face: "F", cells: [2, 5, 8] }, { face: "U", cells: [2, 5, 8] }, { face: "B", cells: [0, 3, 6] }, { face: "D", cells: [2, 5, 8] }],
  L: [{ face: "F", cells: [0, 3, 6] }, { face: "U", cells: [0, 3, 6] }, { face: "B", cells: [2, 5, 8] }, { face: "D", cells: [0, 3, 6] }],
  U: [{ face: "F", cells: [0, 1, 2] }, { face: "R", cells: [0, 1, 2] }, { face: "B", cells: [0, 1, 2] }, { face: "L", cells: [0, 1, 2] }],
  D: [{ face: "F", cells: [6, 7, 8] }, { face: "R", cells: [6, 7, 8] }, { face: "B", cells: [6, 7, 8] }, { face: "L", cells: [6, 7, 8] }],
  F: [{ face: "U", cells: [6, 7, 8] }, { face: "R", cells: [0, 3, 6] }, { face: "D", cells: [0, 1, 2] }, { face: "L", cells: [2, 5, 8] }],
  B: [{ face: "U", cells: [0, 1, 2] }, { face: "R", cells: [2, 5, 8] }, { face: "D", cells: [6, 7, 8] }, { face: "L", cells: [0, 3, 6] }],
};

const F2L_SLOT_STICKERS: Record<string, Partial<Record<"U" | "R" | "F" | "D" | "L" | "B", number[]>>> = {
  FR: { D: [2], F: [5, 8], R: [3, 6] },
  FL: { D: [0], F: [3, 6], L: [5, 8] },
  BL: { D: [6], B: [5, 8], L: [3, 6] },
  BR: { D: [8], B: [3, 6], R: [5, 8] },
};

const LAST_LAYER_STICKERS: Partial<Record<"U" | "R" | "F" | "D" | "L" | "B", number[]>> = {
  U: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  F: [0, 1, 2], R: [0, 1, 2], B: [0, 1, 2], L: [0, 1, 2],
};

function Face({ face, state, inspectCross, crossColor, xcrossSlots, lastLayerCase }: { face: "U" | "R" | "F" | "D" | "L" | "B"; state: string; inspectCross: boolean; crossColor: string; xcrossSlots?: string[]; lastLayerCase?: { family: string; id: string } }) {
  const crossEdges = new Set([1, 3, 5, 7]);
  return <div className={`cube3d-face cube3d-${face.toLowerCase()}`}>{Array.from({ length: 9 }, (_, index) => {
    const highlighted = inspectCross && crossEdges.has(index) && state[faceOffset[face] + index] === crossColor;
    const slotHighlighted = Boolean(xcrossSlots?.some((slot) => F2L_SLOT_STICKERS[slot]?.[face]?.includes(index)));
    const lastLayerHighlighted = Boolean(lastLayerCase && LAST_LAYER_STICKERS[face]?.includes(index));
    return <span key={index} className={highlighted ? "cube3d-cross-sticker" : lastLayerHighlighted ? "cube3d-last-layer-sticker" : slotHighlighted ? "cube3d-xcross-sticker" : ""} style={{ background: color[state[faceOffset[face] + index]] ?? "#777" }} />;
  })}</div>;
}

function LayerTurn({ face, state, angle, step, move, duration }: { face: "U" | "R" | "F" | "D" | "L" | "B"; state: string; angle: string; step: number; move?: string; duration: number }) {
  const sticker = (sourceFace: "U" | "R" | "F" | "D" | "L" | "B", index: number) => <span key={`${sourceFace}-${index}`} style={{ background: color[state[faceOffset[sourceFace] + index]] ?? "#777" }} />;
  return <div key={`${step}-${move}`} className={`cube3d-layer cube3d-layer-${face.toLowerCase()}`} style={{ "--turn-angle": angle, "--turn-duration": `${duration}ms` } as React.CSSProperties}>
    <div className="cube3d-layer-main">{Array.from({ length: 9 }, (_, index) => sticker(face, index))}</div>
    {LAYER_STRIPS[face].map((strip, index) => <div key={`${strip.face}-${index}`} className={`cube3d-layer-strip cube3d-layer-strip-${strip.face.toLowerCase()}`}>{strip.cells.map((cell) => sticker(strip.face, cell))}</div>)}
  </div>;
}

export function Cube3DGuide({ state, previousState, move, step, crossColor = "U", inspection = false, alignCross = false, highlightCross = true, xcrossSlots, lastLayerCase, transition = "idle", transitionDirection = "forward", transitionId = 0, phaseLabel, turnDurationMs = 340 }: { state: string; previousState?: string; move?: string; step: number; crossColor?: string; inspection?: boolean; alignCross?: boolean; highlightCross?: boolean; xcrossSlots?: string[]; lastLayerCase?: { family: string; id: string }; transition?: "idle" | "move" | "seek" | "phase" | "reset"; transitionDirection?: "forward" | "backward"; transitionId?: number; phaseLabel?: string; turnDurationMs?: number }) {
  const { language } = useLanguage();
  const [view, setView] = useState(DEFAULT_VIEW);
  const drag = useRef<{ x: number; y: number; pitch: number; yaw: number; moved: boolean; startedAt: number; pointerType: string } | null>(null);
  const pinch = useRef<number | null>(null);
  const activeInspection = highlightCross && inspection;
  useEffect(() => { if (alignCross) { drag.current = null; setView(CROSS_DOWN_VIEW[crossColor] ?? DEFAULT_VIEW); } }, [alignCross, crossColor]);
  const target = move?.[0] ?? "";
  const motionFace = ({ M: "R", E: "U", S: "F", x: "R", y: "U", z: "F" } as Record<string, string>)[target] ?? target.toUpperCase();
  const animateLayer = Boolean(target) && transition === "move";
  const changeZoom = (amount: number) => setView((previous) => ({ ...previous, zoom: Math.min(1.42, Math.max(0.78, Number((previous.zoom + amount).toFixed(2)))) }));
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, pitch: view.pitch, yaw: view.yaw, moved: false, startedAt: performance.now(), pointerType: event.pointerType };
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const activeDrag = drag.current;
    if (!activeDrag) return;
    if (activeDrag.pointerType === "mouse" && event.buttons === 0) return;
    const pointerX = event.clientX;
    const pointerY = event.clientY;
    const deltaX = pointerX - activeDrag.x;
    const deltaY = pointerY - activeDrag.y;
    const threshold = activeDrag.pointerType === "touch" ? TOUCH_DRAG_THRESHOLD_PX : DRAG_THRESHOLD_PX;
    const heldLongEnough = activeDrag.pointerType !== "touch" || performance.now() - activeDrag.startedAt >= TOUCH_HOLD_TO_ORBIT_MS;
    if (!activeDrag.moved && (!heldLongEnough || Math.hypot(deltaX, deltaY) < threshold)) return;
    activeDrag.moved = true;
    setView((previous) => ({
      ...previous,
      yaw: activeDrag.yaw + deltaX * 0.55,
      pitch: Math.min(35, Math.max(-70, activeDrag.pitch - deltaY * 0.45)),
    }));
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); drag.current = null; };
  const wheel = (event: WheelEvent<HTMLDivElement>) => { event.preventDefault(); changeZoom(event.deltaY > 0 ? -0.08 : 0.08); };
  const touchStart = (event: TouchEvent<HTMLDivElement>) => { if (event.touches.length === 2) pinch.current = Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY); };
  const touchMove = (event: TouchEvent<HTMLDivElement>) => { if (event.touches.length !== 2 || pinch.current === null) return; const distance = Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY); changeZoom((distance - pinch.current) / 240); pinch.current = distance; };
  const reset = () => setView(alignCross ? CROSS_DOWN_VIEW[crossColor] ?? DEFAULT_VIEW : DEFAULT_VIEW);
  const transform = `rotateZ(${view.roll}deg) rotateX(${view.pitch}deg) rotateY(${view.yaw}deg) scale3d(${view.zoom}, ${view.zoom}, ${view.zoom})`;
  const turnAngle = move?.endsWith("2") ? "180deg" : move?.endsWith("'") ? "-90deg" : "90deg";
  return <div className="cube3d-guide rounded-sm border-2 border-[#17221d] bg-[#17221d] p-3 text-[#f4f0e8]">
    <div className={`cube3d-stage interactive-cube-stage cube3d-transition-${transition}`} aria-label={language === "vi" ? "Mô hình Rubik 3D, kéo để xoay và pinch hoặc cuộn để phóng to" : "3D Rubik model, drag to orbit and pinch or scroll to zoom"} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={wheel} onTouchStart={touchStart} onTouchMove={touchMove}>
      <div className={`cube3d-motion-shell cube3d-motion-${transition} cube3d-motion-${transitionDirection}`}><div className="cube3d-model" style={{ "--cube-transform": transform, transform } as React.CSSProperties}>{(["F", "R", "U", "B", "L", "D"] as const).map((face) => <Face key={`${step}-${move}-${face}`} face={face} state={state} inspectCross={activeInspection} crossColor={crossColor} xcrossSlots={xcrossSlots} lastLayerCase={lastLayerCase} />)}{animateLayer && <LayerTurn face={motionFace as "U" | "R" | "F" | "D" | "L" | "B"} state={previousState ?? state} angle={turnAngle} step={step} move={move} duration={turnDurationMs} />}</div></div>
      {transition === "phase" && phaseLabel && <div key={transitionId} className="cube3d-phase-callout" aria-live="polite"><span>{language === "vi" ? "CHUYỂN PHA" : "PHASE SHIFT"}</span><b>{phaseLabel}</b></div>}
    </div>
    <div className="mt-1 flex justify-end"><button type="button" onClick={reset} className="cube-mini-control" aria-label={language === "vi" ? "Đặt lại góc nhìn 3D" : "Reset 3D view"} title={language === "vi" ? "Đặt lại góc nhìn" : "Reset view"}><Rotate3D className="h-3.5 w-3.5" /></button></div>
  </div>;
}
