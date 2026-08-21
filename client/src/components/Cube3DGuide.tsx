/** Interactive CSS 3D cube: drag to orbit, wheel/pinch to zoom, and reset at any time. */
import { Eye, EyeOff, Minus, Move3D, Plus, Rotate3D } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent, type TouchEvent, type WheelEvent } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const color: Record<string, string> = { U: "#f7f3e9", R: "#d95743", F: "#1ba77a", D: "#e7c34f", L: "#ed8e42", B: "#3b6fc7" };
const faceOffset: Record<"U" | "R" | "F" | "D" | "L" | "B", number> = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };
const DEFAULT_VIEW = { pitch: -26, yaw: 34, roll: 0, zoom: 1 };
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

function Face({ face, state, inspectCross, crossColor, xcrossSlot }: { face: "U" | "R" | "F" | "D" | "L" | "B"; state: string; inspectCross: boolean; crossColor: string; xcrossSlot?: string }) {
  const crossEdges = new Set([1, 3, 5, 7]);
  return <div className={`cube3d-face cube3d-${face.toLowerCase()}`}>{Array.from({ length: 9 }, (_, index) => {
    const highlighted = inspectCross && crossEdges.has(index) && state[faceOffset[face] + index] === crossColor;
    const slotHighlighted = Boolean(xcrossSlot && F2L_SLOT_STICKERS[xcrossSlot]?.[face]?.includes(index));
    return <span key={index} className={highlighted ? "cube3d-cross-sticker" : slotHighlighted ? "cube3d-xcross-sticker" : ""} style={{ background: color[state[faceOffset[face] + index]] ?? "#777" }} />;
  })}</div>;
}

function LayerTurn({ face, state, angle, step, move }: { face: "U" | "R" | "F" | "D" | "L" | "B"; state: string; angle: string; step: number; move?: string }) {
  const sticker = (sourceFace: "U" | "R" | "F" | "D" | "L" | "B", index: number) => <span key={`${sourceFace}-${index}`} style={{ background: color[state[faceOffset[sourceFace] + index]] ?? "#777" }} />;
  return <div key={`${step}-${move}`} className={`cube3d-layer cube3d-layer-${face.toLowerCase()}`} style={{ "--turn-angle": angle } as React.CSSProperties}>
    <div className="cube3d-layer-main">{Array.from({ length: 9 }, (_, index) => sticker(face, index))}</div>
    {LAYER_STRIPS[face].map((strip, index) => <div key={`${strip.face}-${index}`} className={`cube3d-layer-strip cube3d-layer-strip-${strip.face.toLowerCase()}`}>{strip.cells.map((cell) => sticker(strip.face, cell))}</div>)}
  </div>;
}

export function Cube3DGuide({ state, previousState, move, step, crossColor = "U", inspection = false, alignCross = false, highlightCross = true, xcrossSlot }: { state: string; previousState?: string; move?: string; step: number; crossColor?: string; inspection?: boolean; alignCross?: boolean; highlightCross?: boolean; xcrossSlot?: string }) {
  const { language } = useLanguage();
  const [view, setView] = useState(DEFAULT_VIEW);
  const drag = useRef<{ x: number; y: number; pitch: number; yaw: number } | null>(null);
  const pinch = useRef<number | null>(null);
  const [inspectCross, setInspectCross] = useState(false);
  const activeInspection = highlightCross && (inspection || inspectCross);
  useEffect(() => { if (alignCross) { drag.current = null; setView(CROSS_DOWN_VIEW[crossColor] ?? DEFAULT_VIEW); } }, [alignCross, crossColor]);
  const target = move?.[0] ?? "";
  const motionFace = ({ M: "R", E: "U", S: "F", x: "R", y: "U", z: "F" } as Record<string, string>)[target] ?? target.toUpperCase();
  const plain = language === "vi" ? (move ? `Mặt ${target} vừa xoay theo ký hiệu ${move}` : "Kéo để xoay góc nhìn, cuộn để phóng to") : (move ? `Face ${target} just turned with ${move}` : "Drag to rotate the view; scroll to zoom");
  const changeZoom = (amount: number) => setView((previous) => ({ ...previous, zoom: Math.min(1.32, Math.max(0.78, Number((previous.zoom + amount).toFixed(2)))) }));
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => { event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, pitch: view.pitch, yaw: view.yaw }; };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const activeDrag = drag.current;
    if (!activeDrag) return;
    const pointerX = event.clientX;
    const pointerY = event.clientY;
    setView((previous) => ({
      ...previous,
      yaw: activeDrag.yaw + (pointerX - activeDrag.x) * 0.55,
      pitch: Math.min(35, Math.max(-70, activeDrag.pitch - (pointerY - activeDrag.y) * 0.45)),
    }));
  };
  const pointerUp = () => { drag.current = null; };
  const wheel = (event: WheelEvent<HTMLDivElement>) => { event.preventDefault(); changeZoom(event.deltaY > 0 ? -0.08 : 0.08); };
  const touchStart = (event: TouchEvent<HTMLDivElement>) => { if (event.touches.length === 2) pinch.current = Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY); };
  const touchMove = (event: TouchEvent<HTMLDivElement>) => { if (event.touches.length !== 2 || pinch.current === null) return; const distance = Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY); changeZoom((distance - pinch.current) / 240); pinch.current = distance; };
  const reset = () => setView(alignCross ? CROSS_DOWN_VIEW[crossColor] ?? DEFAULT_VIEW : DEFAULT_VIEW);
  const transform = `rotateZ(${view.roll}deg) rotateX(${view.pitch}deg) rotateY(${view.yaw}deg) scale(${view.zoom})`;
  const turnAngle = move?.endsWith("2") ? "180deg" : move?.endsWith("'") ? "-90deg" : "90deg";
  return <div className="cube3d-guide rounded-sm border-2 border-[#17221d] bg-[#17221d] p-4 text-[#f4f0e8]">
    <div className="flex items-center justify-between"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#1ba77a]">3D CUBE</p>{inspection ? <span className="font-mono text-[9px] text-[#f4f0e8]/55">{activeInspection ? "CROSS · ON" : "CROSS · OFF"}</span> : <button type="button" onClick={() => setInspectCross((value) => !value)} className="cube-mini-control" aria-label={language === "vi" ? "Bật hoặc tắt highlight Cross" : "Toggle Cross highlight"} aria-pressed={inspectCross}>{inspectCross ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}<span className="text-[9px]">{language === "vi" ? "CROSS" : "CROSS"}</span></button>}</div>
    <div className="cube3d-stage interactive-cube-stage" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={wheel} onTouchStart={touchStart} onTouchMove={touchMove}>
      <div className="cube3d-model" style={{ "--cube-transform": transform, transform } as React.CSSProperties}>{(["F", "R", "U", "B", "L", "D"] as const).map((face) => <Face key={`${step}-${move}-${face}`} face={face} state={state} inspectCross={activeInspection} crossColor={crossColor} xcrossSlot={xcrossSlot} />)}{target && <LayerTurn face={motionFace as "U" | "R" | "F" | "D" | "L" | "B"} state={previousState ?? state} angle={turnAngle} step={step} move={move} />}</div>
      {target && <span className="cube-turn-badge">{move}</span>}
    </div>
    <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-2"><span className="max-w-[75%] text-xs text-[#f4f0e8]/65">{activeInspection ? (language === "vi" ? "Đang làm nổi bốn sticker Cross của màu đã chọn." : "The four Cross stickers of the selected color are highlighted.") : xcrossSlot ? (language === "vi" ? `Slot F2L ${xcrossSlot} của XCross đang được đánh dấu.` : `The XCross F2L ${xcrossSlot} slot is highlighted.`) : plain}</span><b className="rounded bg-[#1ba77a] px-2 py-1 font-mono text-sm text-[#17221d]">{move ?? "—"}</b></div>
    <div className="mt-3 flex items-center justify-between gap-2"><span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#f4f0e8]/55"><Move3D className="h-3.5 w-3.5" />{language === "vi" ? "Kéo / pinch" : "Drag / pinch"}</span><div className="flex gap-1"><button onClick={() => changeZoom(-0.1)} className="cube-mini-control" aria-label="Zoom out"><Minus className="h-3.5 w-3.5" /></button><button onClick={reset} className="cube-mini-control text-[10px]">{language === "vi" ? "Góc gốc" : "Reset"}</button><button onClick={() => changeZoom(0.1)} className="cube-mini-control" aria-label="Zoom in"><Plus className="h-3.5 w-3.5" /></button></div></div>
  </div>;
}
