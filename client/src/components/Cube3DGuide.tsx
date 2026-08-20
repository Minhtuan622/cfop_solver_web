/** Simple 3D cube guide: highlights the move being applied without requiring WebGL. */
import { Rotate3D } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const color: Record<string, string> = { U: "#f7f3e9", R: "#d95743", F: "#1ba77a", D: "#e7c34f", L: "#ed8e42", B: "#3b6fc7" };
const faceOffset: Record<"U" | "R" | "F", number> = { U: 0, R: 9, F: 18 };

function Face({ face, state }: { face: "U" | "R" | "F"; state: string }) {
  return <div className={`cube3d-face cube3d-${face.toLowerCase()}`}>{Array.from({ length: 9 }, (_, index) => <span key={index} style={{ background: color[state[faceOffset[face] + index]] ?? "#777" }} />)}</div>;
}

export function Cube3DGuide({ state, move, step }: { state: string; move?: string; step: number }) {
  const { language } = useLanguage();
  const target = move?.[0] ?? "";
  const plain = language === "vi" ? (move ? `Xoay mặt ${target} theo ký hiệu ${move}` : "Bấm Phát để xem khối xoay") : (move ? `Turn face ${target} using ${move}` : "Press Play to watch the cube turn");
  return <div className="cube3d-guide rounded-xl border-2 border-[#17221d] bg-[#17221d] p-4 text-[#f4f0e8]">
    <div className="flex items-center justify-between"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#1ba77a]">3D GUIDE</p><Rotate3D className="h-4 w-4 text-[#1ba77a]" /></div>
    <div className="cube3d-stage"><div key={`${step}-${move}`} className={`cube3d-model ${target ? `cube3d-turn-${target.toLowerCase()}` : ""}`}><Face face="F" state={state} /><Face face="R" state={state} /><Face face="U" state={state} /></div></div>
    <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-2"><span className="text-xs text-[#f4f0e8]/65">{plain}</span><b className="rounded bg-[#1ba77a] px-2 py-1 font-mono text-sm text-[#17221d]">{move ?? "—"}</b></div>
  </div>;
}
