/**
 * Xưởng Cơ Khí Tốc Độ — cube net uses six calibrated sticker fields; Rubik
 * colors are reserved for state signaling and never for decorative surfaces.
 */
import { cn } from "@/lib/utils";

export const FACE_ORDER = ["U", "R", "F", "D", "L", "B"] as const;
export const FACE_GRID: Record<(typeof FACE_ORDER)[number], string> = {
  U: "col-start-2 row-start-1",
  L: "col-start-1 row-start-2",
  F: "col-start-2 row-start-2",
  R: "col-start-3 row-start-2",
  B: "col-start-4 row-start-2",
  D: "col-start-2 row-start-3",
};
export const FACE_OFFSET: Record<(typeof FACE_ORDER)[number], number> = {
  U: 0,
  R: 9,
  F: 18,
  D: 27,
  L: 36,
  B: 45,
};
export const CUBE_COLOR: Record<string, string> = {
  U: "#F7F3E9",
  R: "#D95743",
  F: "#1BA77A",
  D: "#E7C34F",
  L: "#ED8E42",
  B: "#3B6FC7",
};

export function CubeNet({ state, compact = false, inspectCross = false, crossColor = "U" }: { state: string; compact?: boolean; inspectCross?: boolean; crossColor?: string }) {
  return (
    <div
      aria-label="Trạng thái Rubik dạng cube net"
      className={cn(
        "grid grid-cols-4 grid-rows-3 gap-1.5 rounded-[1.35rem] bg-[#17221d] p-3 shadow-[12px_12px_0_#1ba77a]",
        compact ? "w-[224px]" : "w-full max-w-[530px]",
      )}
    >
      {FACE_ORDER.map((face) => (
        <div key={face} className={cn("relative aspect-square", FACE_GRID[face])}>
          <span className="absolute -left-0.5 -top-4 font-mono text-[9px] font-bold tracking-[0.18em] text-[#f4f0e8]/55">
            {face}
          </span>
          <div className="grid h-full grid-cols-3 gap-[2px] rounded-sm border border-white/15 bg-black/20 p-[2px]">
            {Array.from({ length: 9 }, (_, index) => {
              const sticker = state[FACE_OFFSET[face] + index] ?? "U";
              const highlighted = inspectCross && [1, 3, 5, 7].includes(index) && sticker === crossColor;
              return (
                <span
                  key={index}
                  className={cn("rounded-[2px] border border-black/20 shadow-[inset_0_-2px_0_rgba(0,0,0,0.14)]", highlighted && "z-10 ring-2 ring-white shadow-[0_0_0_3px_#1ba77a,0_0_12px_3px_rgba(27,167,122,.75)]")}
                  style={{ background: CUBE_COLOR[sticker] ?? "#888" }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export const SOLVED_STATE = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
