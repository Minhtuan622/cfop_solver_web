import { cn } from "@/lib/utils";
import { CUBE_COLORS } from "@/features/puzzle-3d/lib/cubeColors";

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

const LAST_LAYER_STICKERS: Record<Face, number[]> = {
  U: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  R: [0, 1, 2],
  F: [0, 1, 2],
  D: [],
  L: [0, 1, 2],
  B: [0, 1, 2],
};
const DIMMED_STICKER = "#3f4653";

export function CubeNet({
  state,
  compact = false,
  inspectCross = false,
  crossColor = "U",
  lastLayerOnly = false,
}: {
  state: string;
  compact?: boolean;
  inspectCross?: boolean;
  crossColor?: string;
  lastLayerOnly?: boolean;
}) {
  const safeState = state.length === 54 ? state : SOLVED_STATE;
  return (
    <div
      aria-label="Trạng thái khối dạng CubeNet"
      className={cn("cube-net", compact && "cube-net--compact")}
    >
      {FACE_ORDER.map(face => (
        <div key={face} className={cn("cube-net-face", FACE_GRID[face])}>
          <span className="cube-net-face-label">{face}</span>
          <div className="cube-net-stickers">
            {Array.from({ length: 9 }, (_, index) => {
              const sticker = safeState[FACE_OFFSET[face] + index] ?? "U";
              const highlighted =
                inspectCross &&
                [1, 3, 5, 7].includes(index) &&
                sticker === crossColor;
              const dimmed =
                lastLayerOnly && !LAST_LAYER_STICKERS[face].includes(index);
              const stickerClass = cn(
                "cube-sticker",
                highlighted && "cube-sticker--highlight",
                dimmed && "cube-sticker--dimmed"
              );
              const style = dimmed
                ? { background: DIMMED_STICKER }
                : { background: CUBE_COLOR[sticker] ?? "#888" };
              return (
                <span key={index} className={stickerClass} style={style} />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export const SOLVED_STATE =
  "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
