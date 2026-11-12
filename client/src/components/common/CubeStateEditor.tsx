/**
 * Xưởng Cơ Khí Tốc Độ — manual state entry stays tactile: one palette, six
 * calibrated faces and fixed centers make a valid CFOP input inspectable.
 */
import { useEffect, useMemo, useState } from "react";
import { Redo2, RotateCcw, Undo2 } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/StudioUI";
import {
  CUBE_COLOR,
  FACE_GRID,
  FACE_OFFSET,
  FACE_ORDER,
  SOLVED_STATE,
} from "@/components/common/CubeNet";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type Face = (typeof FACE_ORDER)[number];

export function CubeStateEditor({
  state,
  onChange,
  disabled = false,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  selectedColor: controlledColor,
  onSelectedColorChange,
  controlsOnly = false,
}: {
  state: string;
  onChange: (state: string) => void;
  disabled?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  selectedColor?: Face;
  onSelectedColorChange?: (color: Face) => void;
  controlsOnly?: boolean;
}) {
  const safeState = state.length === 54 ? state : SOLVED_STATE;
  const [localColor, setLocalColor] = useState<Face>("U");
  const selectedColor = controlledColor ?? localColor;
  const setSelectedColor = onSelectedColorChange ?? setLocalColor;
  const stickerCounts = useMemo(
    () =>
      Object.fromEntries(
        FACE_ORDER.map(face => [
          face,
          Array.from(safeState).filter(sticker => sticker === face).length,
        ])
      ) as Record<Face, number>,
    [safeState]
  );
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      )
        return;
      if (
        event.key.toLowerCase() === "z" &&
        !event.shiftKey &&
        canUndo &&
        !disabled
      ) {
        event.preventDefault();
        onUndo?.();
      }
      if (
        (event.key.toLowerCase() === "y" ||
          (event.key.toLowerCase() === "z" && event.shiftKey)) &&
        canRedo &&
        !disabled
      ) {
        event.preventDefault();
        onRedo?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canRedo, canUndo, disabled, onRedo, onUndo]);
  const paintSticker = (face: Face, stickerIndex: number, color: Face) => {
    if (stickerIndex === 4) return;
    const index = FACE_OFFSET[face] + stickerIndex;
    onChange(
      `${safeState.slice(0, index)}${color}${safeState.slice(index + 1)}`
    );
  };
  const fillFace = (face: Face, color: Face) => {
    const stickers = safeState.split("");
    for (let index = 0; index < 9; index += 1)
      if (index !== 4) stickers[FACE_OFFSET[face] + index] = color;
    onChange(stickers.join(""));
  };

  return (
    <div className="rounded-card border border-line/80 bg-surface shadow-soft bg-surface-2">
      <div className="p-5 sm:p-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm uppercase tracking-wide font-semibold text-muted mb-0">
            Màu tô
          </p>
          <div className="inline-flex flex-wrap items-center gap-1 text-xs">
            <IconButton
              label="Undo sticker edit"
              icon={<Undo2 className="text-base" />}
              disabled={disabled || !canUndo}
              onClick={onUndo}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2"
              title="Undo · Ctrl/Cmd + Z"
            />
            <IconButton
              label="Redo sticker edit"
              icon={<Redo2 className="text-base" />}
              disabled={disabled || !canRedo}
              onClick={onRedo}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2"
              title="Redo · Ctrl/Cmd + Shift + Z"
            />
            <IconButton
              label="Reset sticker state"
              icon={<RotateCcw className="text-base" />}
              disabled={disabled}
              onClick={() => onChange(SOLVED_STATE)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2"
            />
          </div>
        </div>
        <div
          className="grid grid-cols-12 gap-2 mt-2"
          role="radiogroup"
          aria-label="Bảng màu và số lượng sticker"
        >
          {FACE_ORDER.map(face => (
            <div className="col-span-4" key={face}>
              <PaletteButton
                face={face}
                count={stickerCounts[face]}
                selected={selectedColor === face}
                onSelect={setSelectedColor}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
        {!controlsOnly && (
          <>
            <div className="cube-editor-grid mt-6">
              {FACE_ORDER.map(face => (
                <EditorFace
                  key={face}
                  face={face}
                  state={safeState}
                  selectedColor={selectedColor}
                  disabled={disabled}
                  onPaint={paintSticker}
                  onFill={fillFace}
                />
              ))}
            </div>
            <p className="text-sm text-muted mt-4 mb-0">
              Chọn màu rồi tô sticker; nhấn tên mặt để tô cả mặt. Tâm mỗi mặt
              luôn khóa.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function PaletteButton({
  face,
  count,
  selected,
  onSelect,
  disabled,
}: {
  face: Face;
  count: number;
  selected: boolean;
  onSelect: (color: Face) => void;
  disabled: boolean;
}) {
  return (
    <Button
      variant={selected ? "primary" : "secondary"}
      size="sm"
      className="w-full flex justify-between"
      type="button"
      disabled={disabled}
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(face)}

      aria-label={`Chọn màu ${face}: ${count} trên 9 sticker`}
    >
      <span className="inline-flex items-center gap-1">
        <span
          className="rounded-xl border border-line"
          style={{
            width: "0.875rem",
            height: "0.875rem",
            background: CUBE_COLOR[face],
          }}
        />
        <span>{face}</span>
      </span>
      <span className={count === 9 ? "text-success" : "text-danger"}>
        {count}/9
      </span>
    </Button>
  );
}

function EditorFace({
  face,
  state,
  selectedColor,
  disabled,
  onPaint,
  onFill,
}: {
  face: Face;
  state: string;
  selectedColor: Face;
  disabled: boolean;
  onPaint: (face: Face, index: number, color: Face) => void;
  onFill: (face: Face, color: Face) => void;
}) {
  return (
    <div className={cn("cube-net-face", FACE_GRID[face])} data-cube-face={face}>
      <Button
        type="button"
        variant="secondary"
        size="plain"
        className="cube-editor-face-label px-1 py-0 text-xs"
        disabled={disabled}
        onClick={() => onFill(face, selectedColor)}
      >
        {face}
      </Button>
      <div className="cube-net-stickers">
        {Array.from({ length: 9 }, (_, index) => {
          const sticker = state[FACE_OFFSET[face] + index] as Face;
          const locked = index === 4;
          return (
            <button
              type="button"
              key={index}
              disabled={disabled || locked}
              onClick={() => onPaint(face, index, selectedColor)}
              aria-label={`${face} sticker ${index + 1}: ${sticker}${locked ? ", tâm khóa" : ""}`}
              className={cn(
                "cube-sticker",
                locked && "cube-sticker--center",
                !locked && "cube-sticker--editable"
              )}
              style={{ background: CUBE_COLOR[sticker] ?? "#888" }}
            />
          );
        })}
      </div>
    </div>
  );
}
