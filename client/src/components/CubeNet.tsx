import type { CSSProperties } from "react";

export const FACE_ORDER = ["U", "R", "F", "D", "L", "B"] as const;
export const FACE_GRID: Record<(typeof FACE_ORDER)[number], string> = {
  U: "col-start-2 row-start-1", L: "col-start-1 row-start-2", F: "col-start-2 row-start-2", R: "col-start-3 row-start-2", B: "col-start-4 row-start-2", D: "col-start-2 row-start-3",
};
export const FACE_OFFSET: Record<(typeof FACE_ORDER)[number], number> = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };
export const CUBE_COLOR: Record<string, string> = { U: "#F7F3E9", R: "#D95743", F: "#1BA77A", D: "#E7C34F", L: "#ED8E42", B: "#3B6FC7" };

type Face = (typeof FACE_ORDER)[number];
type CubeNetProps = { state: string; compact?: boolean; inspectCross?: boolean; crossColor?: string; editable?: boolean; selectedColor?: Face; onStateChange?: (state: string) => void; disabled?: boolean; emphasis?: "default" | "studio" };

export function CubeNet({ state, compact = false, inspectCross = false, crossColor = "U", editable = false, selectedColor = "U", onStateChange, disabled = false }: CubeNetProps) {
  const safeState = state.length === 54 ? state : SOLVED_STATE;
  const netStyle: CSSProperties = { maxWidth: compact ? "14rem" : "33rem" };
  const paint = (face: Face, stickerIndex: number) => { if (!editable || disabled || stickerIndex === 4) return; const position = FACE_OFFSET[face] + stickerIndex; onStateChange?.(`${safeState.slice(0, position)}${selectedColor}${safeState.slice(position + 1)}`); };
  const fill = (face: Face) => { if (!editable || disabled) return; const stickers = safeState.split(""); for (let index = 0; index < 9; index += 1) if (index !== 4) stickers[FACE_OFFSET[face] + index] = selectedColor; onStateChange?.(stickers.join("")); };
  const FaceTile = ({ face }: { face: Face }) => <div className="col"><div className="position-relative" style={{ aspectRatio: "1" }}>
    {editable ? <button type="button" disabled={disabled} onClick={() => fill(face)} className="btn btn-link btn-sm position-absolute top-0 start-0 translate-middle-y p-0 text-white-50 text-decoration-none" title="Tô cả mặt bằng màu đang chọn">{face}</button> : <span className="position-absolute top-0 start-0 translate-middle-y small text-white-50">{face}</span>}
    <div className="row g-1 h-100 m-0 p-1 border border-secondary rounded-1">{Array.from({ length: 9 }, (_, index) => { const sticker = safeState[FACE_OFFSET[face] + index] ?? "U"; const highlighted = inspectCross && [1, 3, 5, 7].includes(index) && sticker === crossColor; const style: CSSProperties = { backgroundColor: CUBE_COLOR[sticker] ?? "#888", outline: highlighted ? "3px solid #fff" : undefined, outlineOffset: highlighted ? "-3px" : undefined }; const className = `col p-0 border ${highlighted ? "border-3 border-white" : "border-dark-subtle"}`; return editable ? <button type="button" key={index} disabled={disabled || index === 4} onClick={() => paint(face, index)} aria-label={`${face} sticker ${index + 1}: ${sticker}${index === 4 ? ", tâm khóa" : ""}`} className={`btn ${className} rounded-1`} style={style} /> : <span key={index} className={className} style={style} />; })}</div>
  </div></div>;
  return <div aria-label={editable ? "Sơ đồ Rubik 2D có thể tô sticker trực tiếp" : "Trạng thái Rubik dạng cube net"} className="card bg-dark p-3 w-100" style={netStyle}><div className="row g-1 justify-content-center"><div className="col-3"><FaceTile face="U" /></div></div><div className="row g-1"><FaceTile face="L" /><FaceTile face="F" /><FaceTile face="R" /><FaceTile face="B" /></div><div className="row g-1 justify-content-center"><div className="col-3"><FaceTile face="D" /></div></div></div>;
}

export const SOLVED_STATE = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
