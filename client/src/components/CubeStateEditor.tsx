/**
 * Xưởng Cơ Khí Tốc Độ — manual state entry stays tactile: one palette, six
 * calibrated faces and fixed centers make a valid CFOP input inspectable.
 */
import { useEffect, useMemo, useState } from "react";
import { Redo2, RotateCcw, Undo2 } from "lucide-react";
import { CUBE_COLOR, FACE_GRID, FACE_OFFSET, FACE_ORDER, SOLVED_STATE } from "@/components/CubeNet";
import { cn } from "@/lib/utils";

type Face = (typeof FACE_ORDER)[number];

export function CubeStateEditor({ state, onChange, disabled = false, canUndo = false, canRedo = false, onUndo, onRedo, selectedColor: controlledColor, onSelectedColorChange, controlsOnly = false }: { state: string; onChange: (state: string) => void; disabled?: boolean; canUndo?: boolean; canRedo?: boolean; onUndo?: () => void; onRedo?: () => void; selectedColor?: Face; onSelectedColorChange?: (color: Face) => void; controlsOnly?: boolean }) {
  const safeState = state.length === 54 ? state : SOLVED_STATE;
  const [localColor, setLocalColor] = useState<Face>("U");
  const selectedColor = controlledColor ?? localColor;
  const setSelectedColor = onSelectedColorChange ?? setLocalColor;
  const stickerCounts = useMemo(() => Object.fromEntries(FACE_ORDER.map((face) => [face, Array.from(safeState).filter((sticker) => sticker === face).length])) as Record<Face, number>, [safeState]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      if (event.key.toLowerCase() === "z" && !event.shiftKey && canUndo && !disabled) { event.preventDefault(); onUndo?.(); }
      if ((event.key.toLowerCase() === "y" || (event.key.toLowerCase() === "z" && event.shiftKey)) && canRedo && !disabled) { event.preventDefault(); onRedo?.(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canRedo, canUndo, disabled, onRedo, onUndo]);
  const paintSticker = (face: Face, stickerIndex: number, color: Face) => {
    if (stickerIndex === 4) return;
    const index = FACE_OFFSET[face] + stickerIndex;
    onChange(`${safeState.slice(0, index)}${color}${safeState.slice(index + 1)}`);
  };
  const fillFace = (face: Face, color: Face) => {
    const stickers = safeState.split("");
    for (let index = 0; index < 9; index += 1) if (index !== 4) stickers[FACE_OFFSET[face] + index] = color;
    onChange(stickers.join(""));
  };

  return <div className="rounded-sm border-2 border-[#17221d]/20 bg-[#f8f5ed] p-3">
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2"><p className="font-monospace text-[9px] fw-bold text-[#17221d]/60">MÀU TÔ</p><div className="d-flex align-items-center gap-1"><button type="button" disabled={disabled || !canUndo} onClick={onUndo} className="rounded-sm border border-[#17221d]/20 bg-white text-[#17221d]/65" aria-label="Undo sticker edit" title="Undo · Ctrl/Cmd + Z"><Undo2 className="" /></button><button type="button" disabled={disabled || !canRedo} onClick={onRedo} className="rounded-sm border border-[#17221d]/20 bg-white text-[#17221d]/65" aria-label="Redo sticker edit" title="Redo · Ctrl/Cmd + Shift + Z"><Redo2 className="" /></button><button type="button" disabled={disabled} onClick={() => onChange(SOLVED_STATE)} className="ml-1 d-inline-flex align-items-center gap-1 font-monospace text-[9px] fw-bold text-[#17221d]/60"><RotateCcw className="" />RESET</button></div></div>
    <div className="mt-3 d-grid" role="radiogroup" aria-label="Bảng màu và số lượng sticker">{FACE_ORDER.map((face) => <PaletteButton key={face} face={face} count={stickerCounts[face]} selected={selectedColor === face} onSelect={setSelectedColor} disabled={disabled} />)}</div>
    {!controlsOnly && <><div className="mt-4 d-grid rounded-sm border border-[#17221d]/18 bg-white">
      {FACE_ORDER.map((face) => <EditorFace key={face} face={face} state={safeState} selectedColor={selectedColor} disabled={disabled} onPaint={paintSticker} onFill={fillFace} />)}
    </div><p className="mt-3 font-monospace text-[9px] text-[#17221d]/55">Chọn màu rồi tô sticker; nhấn tên mặt để tô cả mặt. Tâm mỗi mặt luôn khóa.</p></>}
  </div>;
}

function PaletteButton({ face, count, selected, onSelect, disabled }: { face: Face; count: number; selected: boolean; onSelect: (color: Face) => void; disabled: boolean }) {
  return <button type="button" disabled={disabled} role="radio" aria-checked={selected} onClick={() => onSelect(face)} className={cn("d-flex align-items-center justify-content-between gap-1 rounded border bg-white font-monospace text-[9px] fw-bold text-body", selected ? "border" : "border")} aria-label={`Chọn màu ${face}: ${count} trên 9 sticker`}><span className="d-grid rounded-[2px] border border-black/20" style={{ background: CUBE_COLOR[face] }}>{face}</span><span className={cn("tabular-nums", count === 9 ? "text-success" : "text-body")}>{count}<span className="text-[#17221d]/40">/9</span></span></button>;
}

function EditorFace({ face, state, selectedColor, disabled, onPaint, onFill }: { face: Face; state: string; selectedColor: Face; disabled: boolean; onPaint: (face: Face, index: number, color: Face) => void; onFill: (face: Face, color: Face) => void }) {
  return <div className={cn("position-relative", FACE_GRID[face])} data-cube-face={face}>
    <button type="button" disabled={disabled} onClick={() => onFill(face, selectedColor)} className="position-absolute font-monospace text-[9px] fw-bold text-[#17221d]/65">{face}</button>
    <div className="d-grid h-100 rounded-sm border border-[#17221d]/30 bg-[#17221d]/10">{Array.from({ length: 9 }, (_, index) => { const sticker = state[FACE_OFFSET[face] + index] as Face; const locked = index === 4; return <button type="button" key={index} disabled={disabled || locked} onClick={() => onPaint(face, index, selectedColor)} aria-label={`${face} sticker ${index + 1}: ${sticker}${locked ? ", tâm khóa" : ""}`} className={cn("rounded-[2px] border border-black/20", locked && "ring-1 ring-white/80", !locked && "hover:brightness-110 active:scale-90 disabled:opacity-65")} style={{ background: CUBE_COLOR[sticker] ?? "#888" }} />; })}</div>
  </div>;
}
