/**
 * 2×2×2 cube net for case displays (24 stickers).
 */
import { cn } from "@/lib/utils";
import { CUBE_COLORS } from "@/features/puzzle-3d/lib/cubeColors";

export const FACE_ORDER_2x2 = ["U", "R", "F", "D", "L", "B"] as const;
type Face = (typeof FACE_ORDER_2x2)[number];

const FACE_GRID: Record<Face, string> = {
  U: "cube-net-2x2-face-u",
  L: "cube-net-2x2-face-l",
  F: "cube-net-2x2-face-f",
  R: "cube-net-2x2-face-r",
  B: "cube-net-2x2-face-b",
  D: "cube-net-2x2-face-d",
};
const FACE_OFFSET: Record<Face, number> = {
  U: 0,
  R: 4,
  F: 8,
  D: 12,
  L: 16,
  B: 20,
};

export function CubeNet2x2({
  state,
  compact = false,
  className,
}: {
  state: string;
  compact?: boolean;
  className?: string;
}) {
  const safeState =
    state.length === 24
      ? state
      : "UUUURRRRFFFFDDDDLLLLBBBB";
  return (
    <div
      aria-label="Trạng thái 2x2 dạng net"
      className={cn("cube-net-2x2", compact && "cube-net-2x2--compact", className)}
    >
      {FACE_ORDER_2x2.map(face => (
        <div key={face} className={cn("cube-net-2x2-face", FACE_GRID[face])}>
          <span className="cube-net-2x2-label">{face}</span>
          <div className="cube-net-2x2-stickers">
            {Array.from({ length: 4 }, (_, index) => {
              const sticker = safeState[FACE_OFFSET[face] + index] ?? "U";
              return (
                <span
                  key={index}
                  className="cube-sticker"
                  style={{ background: CUBE_COLORS[sticker] ?? "#888" }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
