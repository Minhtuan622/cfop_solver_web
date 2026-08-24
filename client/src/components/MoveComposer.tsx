/** Xưởng Cơ Khí Tốc Độ — move pad dùng mono telemetry, chip vuông và mint chỉ cho hành động hợp lệ. */
import { useState } from "react";
import { RotateCcw, Undo2, X } from "lucide-react";

const BASE_MOVES = ["U", "R", "F", "D", "L", "B", "M", "E", "S", "x", "y", "z"];
const MOVE_PATTERN = /(?:[URFDLBMESxyz](?:w)?(?:2|')?)/g;

function readMoves(value: string) { return value.match(MOVE_PATTERN) ?? []; }

export function MoveComposer({ value, onChange, label, pasteLabel }: { value: string; onChange: (value: string) => void; label: string; pasteLabel: string }) {
  const [pasteValue, setPasteValue] = useState("");
  const moves = readMoves(value);
  const commit = (next: string[]) => onChange(next.join(" "));
  const append = (move: string) => commit([...moves, move]);
  const appendPaste = () => { const next = readMoves(pasteValue); if (next.length) commit([...moves, ...next]); setPasteValue(""); };
  return <section className="border-2 border-[#17221d]/15 bg-white p-3">
    <div className="d-flex align-items-center justify-content-between gap-3"><p className="font-monospace text-[10px] fw-bold text-[#1ba77a]">{label}</p><p className="font-monospace text-[10px] text-[#17221d]/45">{moves.length} MOVES</p></div>
    <div className="mt-3 border-y border-[#17221d]/10 py-2">{moves.length ? <div className="d-flex flex-wrap gap-1">{moves.map((move, index) => <button key={`${move}-${index}`} onClick={() => commit(moves.filter((_, itemIndex) => itemIndex !== index))} className="d-inline-flex align-items-center gap-1 border border-[#17221d]/20 bg-[#f4f0e8] py-1 font-monospace text-[10px] fw-bold">{move}<X className="" /></button>)}</div> : <p className="font-monospace text-[10px] text-[#17221d]/45">—</p>}</div>
    <div className="mt-3 d-grid gap-1">{BASE_MOVES.map((base) => <div key={base} className="d-grid overflow-hidden border border-[#17221d]/15"><button onClick={() => append(base)} className="">{base}</button><button onClick={() => append(`${base}'`)} className="">′</button><button onClick={() => append(`${base}2`)} className="">2</button></div>)}</div>
    <div className="mt-3 d-flex flex-wrap gap-2"><button onClick={() => commit(moves.slice(0, -1))} disabled={!moves.length} className=""><Undo2 className="" />UNDO</button><button onClick={() => commit([])} disabled={!moves.length} className=""><RotateCcw className="" />CLEAR</button></div>
    <div className="mt-3 d-flex gap-2"><input value={pasteValue} onChange={(event) => setPasteValue(event.target.value)} placeholder={pasteLabel} className="flex-grow-1 border-2 border-[#17221d]/15 bg-[#f4f0e8] px-3 py-2 font-monospace text-xs" /><button onClick={appendPaste} disabled={!readMoves(pasteValue).length} className="">ADD</button></div>
  </section>;
}
