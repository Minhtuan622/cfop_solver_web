/**
 * Xưởng Cơ Khí Tốc Độ — manual state entry stays tactile: one palette, six
 * calibrated faces and fixed centers make a valid CFOP input inspectable.
 */
import { useEffect, useMemo, useState } from "react";
import { Redo2, RotateCcw, Undo2 } from "@/components/BootstrapIcon";
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

  return <div className="card bg-body-tertiary"><div className="card-body p-3">
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2"><p className="small text-uppercase fw-semibold text-body-secondary mb-0">Màu tô</p><div className="btn-group btn-group-sm"><button type="button" disabled={disabled || !canUndo} onClick={onUndo} className="btn btn-outline-secondary" aria-label="Undo sticker edit" title="Undo · Ctrl/Cmd + Z"><Undo2 className="fs-6" /></button><button type="button" disabled={disabled || !canRedo} onClick={onRedo} className="btn btn-outline-secondary" aria-label="Redo sticker edit" title="Redo · Ctrl/Cmd + Shift + Z"><Redo2 className="fs-6" /></button><button type="button" disabled={disabled} onClick={() => onChange(SOLVED_STATE)} className="btn btn-outline-secondary" aria-label="Reset sticker state"><RotateCcw className="fs-6" /></button></div></div>
    <div className="row g-2 mt-2" role="radiogroup" aria-label="Bảng màu và số lượng sticker">{FACE_ORDER.map((face) => <div className="col-4" key={face}><PaletteButton face={face} count={stickerCounts[face]} selected={selectedColor === face} onSelect={setSelectedColor} disabled={disabled} /></div>)}</div>
    {!controlsOnly && <><div className="cube-editor-grid mt-4">
      {FACE_ORDER.map((face) => <EditorFace key={face} face={face} state={safeState} selectedColor={selectedColor} disabled={disabled} onPaint={paintSticker} onFill={fillFace} />)}
    </div><p className="small text-body-secondary mt-3 mb-0">Chọn màu rồi tô sticker; nhấn tên mặt để tô cả mặt. Tâm mỗi mặt luôn khóa.</p></>}</div></div>;
}

function PaletteButton({ face, count, selected, onSelect, disabled }: { face: Face; count: number; selected: boolean; onSelect: (color: Face) => void; disabled: boolean }) {
  return <button type="button" disabled={disabled} role="radio" aria-checked={selected} onClick={() => onSelect(face)} className={selected ? "btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-between" : "btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-between"} aria-label={`Chọn màu ${face}: ${count} trên 9 sticker`}><span className="d-inline-flex align-items-center gap-1"><span className="rounded border" style={{ width: "0.875rem", height: "0.875rem", background: CUBE_COLOR[face] }} /><span>{face}</span></span><span className={count === 9 ? "text-success" : "text-danger"}>{count}/9</span></button>;
}

function EditorFace({ face, state, selectedColor, disabled, onPaint, onFill }: { face: Face; state: string; selectedColor: Face; disabled: boolean; onPaint: (face: Face, index: number, color: Face) => void; onFill: (face: Face, color: Face) => void }) {
  return <div className={cn("cube-net-face", FACE_GRID[face])} data-cube-face={face}>
    <button type="button" disabled={disabled} onClick={() => onFill(face, selectedColor)} className="cube-editor-face-label btn btn-outline-secondary btn-sm py-0 px-1">{face}</button>
    <div className="cube-net-stickers">{Array.from({ length: 9 }, (_, index) => { const sticker = state[FACE_OFFSET[face] + index] as Face; const locked = index === 4; return <button type="button" key={index} disabled={disabled || locked} onClick={() => onPaint(face, index, selectedColor)} aria-label={`${face} sticker ${index + 1}: ${sticker}${locked ? ", tâm khóa" : ""}`} className={cn("cube-sticker", locked && "cube-sticker--center", !locked && "cube-sticker--editable")} style={{ background: CUBE_COLOR[sticker] ?? "#888" }} />; })}</div>
  </div>;
}
