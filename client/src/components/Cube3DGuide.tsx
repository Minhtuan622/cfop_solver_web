/** Interactive CSS 3D cube: drag to orbit, wheel/pinch to zoom, and reset at any time. */
import { Eye, EyeOff, Minus, Move3D, Plus, Rotate3D } from "lucide-react";
import { useRef, useState, type PointerEvent, type TouchEvent, type WheelEvent } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const color: Record<string, string> = { U: "#f7f3e9", R: "#d95743", F: "#1ba77a", D: "#e7c34f", L: "#ed8e42", B: "#3b6fc7" };
const faceOffset: Record<"U" | "R" | "F" | "D" | "L" | "B", number> = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };
const DEFAULT_VIEW = { pitch: -26, yaw: 34, zoom: 1 };

function Face({ face, state, turning, turnAngle, inspectCross, crossColor }: { face: "U" | "R" | "F" | "D" | "L" | "B"; state: string; turning: boolean; turnAngle: string; inspectCross: boolean; crossColor: string }) {
  const crossEdges = new Set([1, 3, 5, 7]);
  return <div className={`cube3d-face cube3d-${face.toLowerCase()} ${turning ? "cube3d-face-turn" : ""}`} style={{ "--turn-angle": turnAngle } as React.CSSProperties}>{Array.from({ length: 9 }, (_, index) => {
    const highlighted = inspectCross && crossEdges.has(index) && state[faceOffset[face] + index] === crossColor;
    return <span key={index} className={highlighted ? "cube3d-cross-sticker" : ""} style={{ background: color[state[faceOffset[face] + index]] ?? "#777" }} />;
  })}</div>;
}

export function Cube3DGuide({ state, move, step, crossColor = "U" }: { state: string; move?: string; step: number; crossColor?: string }) {
  const { language } = useLanguage();
  const [view, setView] = useState(DEFAULT_VIEW);
  const drag = useRef<{ x: number; y: number; pitch: number; yaw: number } | null>(null);
  const pinch = useRef<number | null>(null);
  const [inspectCross, setInspectCross] = useState(false);
  const target = move?.[0] ?? "";
  const motionFace = ({ M: "R", E: "U", S: "F", x: "R", y: "U", z: "F" } as Record<string, string>)[target] ?? target.toUpperCase();
  const plain = language === "vi" ? (move ? `Mặt ${target} vừa xoay theo ký hiệu ${move}` : "Kéo để xoay góc nhìn, cuộn để phóng to") : (move ? `Face ${target} just turned with ${move}` : "Drag to rotate the view; scroll to zoom");
  const changeZoom = (amount: number) => setView((previous) => ({ ...previous, zoom: Math.min(1.55, Math.max(0.7, Number((previous.zoom + amount).toFixed(2)))) }));
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
  const reset = () => setView(DEFAULT_VIEW);
  const transform = `rotateX(${view.pitch}deg) rotateY(${view.yaw}deg) scale(${view.zoom})`;
  const turnAngle = move?.endsWith("2") ? "180deg" : move?.endsWith("'") ? "-90deg" : "90deg";
  return <div className="cube3d-guide rounded-sm border-2 border-[#17221d] bg-[#17221d] p-4 text-[#f4f0e8]">
    <div className="flex items-center justify-between"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#1ba77a]">3D CUBE</p><button onClick={() => setInspectCross((value) => !value)} className="cube-mini-control" aria-pressed={inspectCross}>{inspectCross ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}<span className="text-[9px]">{language === "vi" ? "CROSS" : "CROSS"}</span></button></div>
    <div className="cube3d-stage interactive-cube-stage" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={wheel} onTouchStart={touchStart} onTouchMove={touchMove}>
      <div className="cube3d-model" style={{ "--cube-transform": transform, transform } as React.CSSProperties}>{(["F", "R", "U", "B", "L", "D"] as const).map((face) => <Face key={`${step}-${move}-${face}`} face={face} state={state} turning={face === motionFace} turnAngle={turnAngle} inspectCross={inspectCross} crossColor={crossColor} />)}</div>
      {target && <span className="cube-turn-badge">{move}</span>}
    </div>
    <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-2"><span className="max-w-[75%] text-xs text-[#f4f0e8]/65">{inspectCross ? (language === "vi" ? "Đang làm nổi bốn sticker Cross của màu đã chọn." : "The four Cross stickers of the selected color are highlighted.") : plain}</span><b className="rounded bg-[#1ba77a] px-2 py-1 font-mono text-sm text-[#17221d]">{move ?? "—"}</b></div>
    <div className="mt-3 flex items-center justify-between gap-2"><span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#f4f0e8]/55"><Move3D className="h-3.5 w-3.5" />{language === "vi" ? "Kéo / pinch" : "Drag / pinch"}</span><div className="flex gap-1"><button onClick={() => changeZoom(-0.1)} className="cube-mini-control" aria-label="Zoom out"><Minus className="h-3.5 w-3.5" /></button><button onClick={reset} className="cube-mini-control text-[10px]">{language === "vi" ? "Góc gốc" : "Reset"}</button><button onClick={() => changeZoom(0.1)} className="cube-mini-control" aria-label="Zoom in"><Plus className="h-3.5 w-3.5" /></button></div></div>
  </div>;
}
