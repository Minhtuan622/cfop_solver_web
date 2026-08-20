/** Interactive CSS 3D cube: drag to orbit, wheel/pinch to zoom, and reset at any time. */
import { Minus, Move3D, Plus, Rotate3D } from "lucide-react";
import { useRef, useState, type PointerEvent, type TouchEvent, type WheelEvent } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const color: Record<string, string> = { U: "#f7f3e9", R: "#d95743", F: "#1ba77a", D: "#e7c34f", L: "#ed8e42", B: "#3b6fc7" };
const faceOffset: Record<"U" | "R" | "F", number> = { U: 0, R: 9, F: 18 };
const DEFAULT_VIEW = { pitch: -26, yaw: 34, zoom: 1 };

function Face({ face, state }: { face: "U" | "R" | "F"; state: string }) {
  return <div className={`cube3d-face cube3d-${face.toLowerCase()}`}>{Array.from({ length: 9 }, (_, index) => <span key={index} style={{ background: color[state[faceOffset[face] + index]] ?? "#777" }} />)}</div>;
}

export function Cube3DGuide({ state, move, step }: { state: string; move?: string; step: number }) {
  const { language } = useLanguage();
  const [view, setView] = useState(DEFAULT_VIEW);
  const drag = useRef<{ x: number; y: number; pitch: number; yaw: number } | null>(null);
  const pinch = useRef<number | null>(null);
  const target = move?.[0] ?? "";
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
  return <div className="cube3d-guide rounded-xl border-2 border-[#17221d] bg-[#17221d] p-4 text-[#f4f0e8]">
    <div className="flex items-center justify-between"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#1ba77a]">3D CUBE</p><Rotate3D className="h-4 w-4 text-[#1ba77a]" /></div>
    <div className="cube3d-stage interactive-cube-stage" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={wheel} onTouchStart={touchStart} onTouchMove={touchMove}>
      <div key={`${step}-${move}`} className="cube3d-model" style={{ transform: `rotateX(${view.pitch}deg) rotateY(${view.yaw}deg) scale(${view.zoom})` }}><Face face="F" state={state} /><Face face="R" state={state} /><Face face="U" state={state} /></div>
      {target && <span className="cube-turn-badge">{move}</span>}
    </div>
    <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-2"><span className="max-w-[75%] text-xs text-[#f4f0e8]/65">{plain}</span><b className="rounded bg-[#1ba77a] px-2 py-1 font-mono text-sm text-[#17221d]">{move ?? "—"}</b></div>
    <div className="mt-3 flex items-center justify-between gap-2"><span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#f4f0e8]/55"><Move3D className="h-3.5 w-3.5" />{language === "vi" ? "Kéo / pinch" : "Drag / pinch"}</span><div className="flex gap-1"><button onClick={() => changeZoom(-0.1)} className="cube-mini-control" aria-label="Zoom out"><Minus className="h-3.5 w-3.5" /></button><button onClick={reset} className="cube-mini-control text-[10px]">{language === "vi" ? "Góc gốc" : "Reset"}</button><button onClick={() => changeZoom(0.1)} className="cube-mini-control" aria-label="Zoom in"><Plus className="h-3.5 w-3.5" /></button></div></div>
  </div>;
}
