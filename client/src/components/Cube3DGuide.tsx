/**
 * Xưởng Cơ Khí Tốc Độ — the cube moves like a physical layer-turn instrument:
 * short mechanical turns for adjacent moves and a mint relay slate for phase jumps.
 */
import { Rotate3D } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent, type TouchEvent, type WheelEvent } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const color: Record<string, string> = { U: "#f7f3e9", R: "#d95743", F: "#1ba77a", D: "#e7c34f", L: "#ed8e42", B: "#3b6fc7" };
const faceOffset: Record<"U" | "R" | "F" | "D" | "L" | "B", number> = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };
const DEFAULT_CAMERA = { orbit: 0, zoom: 1 };
const DEFAULT_ORIENTATION = "rotateX(-26deg) rotateY(34deg)";
const DRAG_THRESHOLD_PX = 7;
const TOUCH_DRAG_THRESHOLD_PX = 14;
const TOUCH_HOLD_TO_ORBIT_MS = 180;
// Transform functions run right-to-left: first put selected Cross on D, then
// apply one shared view. The outer Y orbit always preserves the Cross-down axis.
const CROSS_TO_DOWN: Record<string, string> = { U: "rotateX(180deg)", D: "", F: "rotateX(90deg)", B: "rotateX(-90deg)", R: "rotateZ(-90deg)", L: "rotateZ(90deg)" };
const crossDownOrientation = (crossColor: string) => `${DEFAULT_ORIENTATION} ${CROSS_TO_DOWN[crossColor] ?? ""}`.trim();

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
  const [camera, setCamera] = useState(DEFAULT_CAMERA);
  const drag = useRef<{ x: number; y: number; orbit: number; moved: boolean; startedAt: number; pointerType: string } | null>(null);
  const pinch = useRef<number | null>(null);
  const activeInspection = highlightCross && inspection;
  useEffect(() => { drag.current = null; setCamera((previous) => ({ ...previous, orbit: 0 })); }, [alignCross, crossColor]);
  const target = move?.[0] ?? "";
  const motionFace = ({ M: "R", E: "U", S: "F", x: "R", y: "U", z: "F" } as Record<string, string>)[target] ?? target.toUpperCase();
  const animateLayer = Boolean(target) && transition === "move";
  const changeZoom = (amount: number) => setCamera((previous) => ({ ...previous, zoom: Math.min(1.42, Math.max(0.78, Number((previous.zoom + amount).toFixed(2)))) }));
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    drag.current = { x: event.clientX, y: event.clientY, orbit: camera.orbit, moved: false, startedAt: performance.now(), pointerType: event.pointerType };
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const activeDrag = drag.current;
    if (!activeDrag) return;
    if (activeDrag.pointerType === "mouse" && event.buttons === 0) { drag.current = null; return; }
    const pointerX = event.clientX;
    const pointerY = event.clientY;
    const deltaX = pointerX - activeDrag.x;
    const deltaY = pointerY - activeDrag.y;
    const threshold = activeDrag.pointerType === "touch" ? TOUCH_DRAG_THRESHOLD_PX : DRAG_THRESHOLD_PX;
    const heldLongEnough = activeDrag.pointerType !== "touch" || performance.now() - activeDrag.startedAt >= TOUCH_HOLD_TO_ORBIT_MS;
    if (!activeDrag.moved && (!heldLongEnough || Math.hypot(deltaX, deltaY) < threshold)) return;
    activeDrag.moved = true;
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
    setCamera((previous) => ({ ...previous, orbit: Math.max(-125, Math.min(125, activeDrag.orbit + deltaX * 0.42)) }));
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); drag.current = null; };
  const pointerLeave = (event: PointerEvent<HTMLDivElement>) => { if (event.pointerType === "mouse" && event.buttons === 0) drag.current = null; };
  const wheel = (event: WheelEvent<HTMLDivElement>) => { event.preventDefault(); changeZoom(event.deltaY > 0 ? -0.08 : 0.08); };
  const touchStart = (event: TouchEvent<HTMLDivElement>) => { if (event.touches.length === 2) pinch.current = Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY); };
  const touchMove = (event: TouchEvent<HTMLDivElement>) => { if (event.touches.length !== 2 || pinch.current === null) return; const distance = Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY); changeZoom((distance - pinch.current) / 240); pinch.current = distance; };
  const reset = () => setCamera((previous) => ({ ...previous, orbit: 0 }));
  const transform = `rotateY(${camera.orbit}deg) ${alignCross ? crossDownOrientation(crossColor) : DEFAULT_ORIENTATION} scale3d(${camera.zoom}, ${camera.zoom}, ${camera.zoom})`;
  const turnAngle = move?.endsWith("2") ? "180deg" : move?.endsWith("'") ? "-90deg" : "90deg";
  return <div className="cube3d-guide rounded-sm border-2 border-[#17221d] bg-[#17221d] p-3 text-[#f4f0e8]">
    <div className={`cube3d-stage interactive-cube-stage cube3d-transition-${transition}`} aria-label={language === "vi" ? "Mô hình Rubik 3D, kéo ngang để orbit quanh Cross ở mặt D; pinch hoặc cuộn để phóng to" : "3D Rubik model, drag horizontally to orbit around the Cross on D; pinch or scroll to zoom"} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onPointerLeave={pointerLeave} onWheel={wheel} onTouchStart={touchStart} onTouchMove={touchMove}>
      <div className={`cube3d-motion-shell cube3d-motion-${transition} cube3d-motion-${transitionDirection}`}><div className="cube3d-model" style={{ "--cube-transform": transform, transform } as React.CSSProperties}>{(["F", "R", "U", "B", "L", "D"] as const).map((face) => <Face key={`${step}-${move}-${face}`} face={face} state={state} inspectCross={activeInspection} crossColor={crossColor} xcrossSlots={xcrossSlots} lastLayerCase={lastLayerCase} />)}{animateLayer && <LayerTurn face={motionFace as "U" | "R" | "F" | "D" | "L" | "B"} state={previousState ?? state} angle={turnAngle} step={step} move={move} duration={turnDurationMs} />}</div></div>
      {transition === "phase" && phaseLabel && <div key={transitionId} className="cube3d-phase-callout" aria-live="polite"><span>{language === "vi" ? "CHUYỂN PHA" : "PHASE SHIFT"}</span><b>{phaseLabel}</b></div>}
    </div>
    <div className="mt-1 flex justify-end"><button type="button" onClick={reset} className="cube-mini-control" aria-label={language === "vi" ? "Đặt lại góc nhìn 3D" : "Reset 3D view"} title={language === "vi" ? "Đặt lại góc nhìn" : "Reset view"}><Rotate3D className="h-3.5 w-3.5" /></button></div>
  </div>;
}
