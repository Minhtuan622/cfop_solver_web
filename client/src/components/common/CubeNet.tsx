/**
 * Xưởng Cơ Khí Tốc Độ — cube net uses six calibrated sticker fields; Rubik
 * colors are reserved for state signaling and never for decorative surfaces.
 */
import { cn } from "@/lib/utils";
import { CUBE_COLORS } from "@/features/puzzle-3d/lib/cubeColors";

/** Kept under the old name so existing call sites keep working. */
export const CUBE_COLOR = CUBE_COLORS;

export const FACE_ORDER = ["U", "R", "F", "D", "L", "B"] as const;
export const FACE_GRID: Record<(typeof FACE_ORDER)[number], string> = {
  U: "cube-net-face-u",
  L: "cube-net-face-l",
  F: "cube-net-face-f",
  R: "cube-net-face-r",
  B: "cube-net-face-b",
  D: "cube-net-face-d",
};
export const FACE_OFFSET: Record<(typeof FACE_ORDER)[number], number> = {
  U: 0,
  R: 9,
  F: 18,
  D: 27,
  L: 36,
  B: 45,
};

type Face = (typeof FACE_ORDER)[number];

export function CubeNet({ state, compact = false, inspectCross = false, crossColor = "U", editable = false, selectedColor = "U", onStateChange, disabled = false, emphasis = "default" }: { state: string; compact?: boolean; inspectCross?: boolean; crossColor?: string; editable?: boolean; selectedColor?: Face; onStateChange?: (state: string) => void; disabled?: boolean; emphasis?: "default" | "studio" }) {
  const safeState = state.length === 54 ? state : SOLVED_STATE;
  const paint = (face: Face, stickerIndex: number) => {
    if (!editable || disabled || stickerIndex === 4) return;
    const position = FACE_OFFSET[face] + stickerIndex;
    onStateChange?.(`${safeState.slice(0, position)}${selectedColor}${safeState.slice(position + 1)}`);
  };
  const fill = (face: Face) => {
    if (!editable || disabled) return;
    const stickers = safeState.split("");
    for (let index = 0; index < 9; index += 1) if (index !== 4) stickers[FACE_OFFSET[face] + index] = selectedColor;
    onStateChange?.(stickers.join(""));
  };
  return (
    <div
      aria-label={editable ? "Sơ đồ Rubik 2D có thể tô sticker trực tiếp" : "Trạng thái Rubik dạng cube net"}
      className={cn(
        "cube-net",
        compact && "cube-net--compact",
        editable && "cube-net-editable",
        emphasis === "studio" && "cube-net--studio",
      )}
    >
      {FACE_ORDER.map((face) => (
        <div key={face} className={cn("cube-net-face", FACE_GRID[face])}>
          {editable ? <button type="button" disabled={disabled} onClick={() => fill(face)} className="cube-net-face-label" title="Tô cả mặt bằng màu đang chọn">
            {face}
          </button> : <span className="cube-net-face-label">{face}</span>}
          <div className="cube-net-stickers">
            {Array.from({ length: 9 }, (_, index) => {
              const sticker = safeState[FACE_OFFSET[face] + index] ?? "U";
              const highlighted = inspectCross && [1, 3, 5, 7].includes(index) && sticker === crossColor;
              const stickerClass = cn(
                "cube-sticker",
                highlighted && "cube-sticker--highlight",
                editable && index !== 4 && "cube-sticker--editable",
                editable && index === 4 && "cube-sticker--center",
              );
              return editable ? <button type="button" key={index} disabled={disabled || index === 4} onClick={() => paint(face, index)} aria-label={`${face} sticker ${index + 1}: ${sticker}${index === 4 ? ", tâm khóa" : ""}`} className={stickerClass} style={{ background: CUBE_COLOR[sticker] ?? "#888" }} /> : <span
                  key={index}
                  className={stickerClass}
                  style={{ background: CUBE_COLOR[sticker] ?? "#888" }}
                />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export const SOLVED_STATE = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
