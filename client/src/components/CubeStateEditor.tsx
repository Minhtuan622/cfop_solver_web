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
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#17221d]/60">MÀU TÔ</p><div className="flex items-center gap-1"><button type="button" disabled={disabled || !canUndo} onClick={onUndo} className="rounded-sm border border-[#17221d]/20 bg-white p-1.5 text-[#17221d]/65 hover:text-[#17221d] disabled:opacity-30" aria-label="Undo sticker edit" title="Undo · Ctrl/Cmd + Z"><Undo2 className="h-3.5 w-3.5" /></button><button type="button" disabled={disabled || !canRedo} onClick={onRedo} className="rounded-sm border border-[#17221d]/20 bg-white p-1.5 text-[#17221d]/65 hover:text-[#17221d] disabled:opacity-30" aria-label="Redo sticker edit" title="Redo · Ctrl/Cmd + Shift + Z"><Redo2 className="h-3.5 w-3.5" /></button><button type="button" disabled={disabled} onClick={() => onChange(SOLVED_STATE)} className="ml-1 inline-flex items-center gap-1 font-mono text-[9px] font-bold text-[#17221d]/60 hover:text-[#17221d] disabled:opacity-40"><RotateCcw className="h-3 w-3" />RESET</button></div></div>
    <div className="mt-3 grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Bảng màu và số lượng sticker">{FACE_ORDER.map((face) => <PaletteButton key={face} face={face} count={stickerCounts[face]} selected={selectedColor === face} onSelect={setSelectedColor} disabled={disabled} />)}</div>
    {!controlsOnly && <><div className="mt-4 grid grid-cols-4 grid-rows-3 gap-1.5 rounded-sm border border-[#17221d]/18 bg-white p-2.5 shadow-[inset_0_0_0_1px_rgba(23,34,29,0.04)]">
      {FACE_ORDER.map((face) => <EditorFace key={face} face={face} state={safeState} selectedColor={selectedColor} disabled={disabled} onPaint={paintSticker} onFill={fillFace} />)}
    </div><p className="mt-3 font-mono text-[9px] leading-4 text-[#17221d]/55">Chọn màu rồi tô sticker; nhấn tên mặt để tô cả mặt. Tâm mỗi mặt luôn khóa.</p></>}
  </div>;
}

function PaletteButton({ face, count, selected, onSelect, disabled }: { face: Face; count: number; selected: boolean; onSelect: (color: Face) => void; disabled: boolean }) {
  return <button type="button" disabled={disabled} role="radio" aria-checked={selected} onClick={() => onSelect(face)} className={cn("flex h-9 items-center justify-between gap-1 rounded-sm border bg-white px-1.5 font-mono text-[9px] font-bold text-[#17221d] disabled:opacity-40", selected ? "border-[#17221d] ring-2 ring-[#1ba77a]" : "border-[#17221d]/30")} aria-label={`Chọn màu ${face}: ${count} trên 9 sticker`}><span className="grid h-5 w-5 place-items-center rounded-[2px] border border-black/20" style={{ background: CUBE_COLOR[face] }}>{face}</span><span className={cn("tabular-nums", count === 9 ? "text-[#1b7b5e]" : "text-[#b64b31]")}>{count}<span className="text-[#17221d]/40">/9</span></span></button>;
}

function EditorFace({ face, state, selectedColor, disabled, onPaint, onFill }: { face: Face; state: string; selectedColor: Face; disabled: boolean; onPaint: (face: Face, index: number, color: Face) => void; onFill: (face: Face, color: Face) => void }) {
  return <div className={cn("relative aspect-square", FACE_GRID[face])} data-cube-face={face}>
    <button type="button" disabled={disabled} onClick={() => onFill(face, selectedColor)} className="absolute -left-0.5 -top-4 font-mono text-[9px] font-bold tracking-[0.18em] text-[#17221d]/65 hover:text-[#1b7b5e] disabled:opacity-40">{face}</button>
    <div className="grid h-full grid-cols-3 gap-[2px] rounded-sm border border-[#17221d]/30 bg-[#17221d]/10 p-[2px]">{Array.from({ length: 9 }, (_, index) => { const sticker = state[FACE_OFFSET[face] + index] as Face; const locked = index === 4; return <button type="button" key={index} disabled={disabled || locked} onClick={() => onPaint(face, index, selectedColor)} aria-label={`${face} sticker ${index + 1}: ${sticker}${locked ? ", tâm khóa" : ""}`} className={cn("rounded-[2px] border border-black/20 shadow-[inset_0_-2px_0_rgba(0,0,0,0.14)]", locked && "ring-1 ring-white/80", !locked && "hover:brightness-110 active:scale-90 disabled:opacity-65")} style={{ background: CUBE_COLOR[sticker] ?? "#888" }} />; })}</div>
  </div>;
}
