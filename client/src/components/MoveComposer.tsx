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
    <div className="flex items-center justify-between gap-3"><p className="font-mono text-[10px] font-bold tracking-[0.14em] text-[#1ba77a]">{label}</p><p className="font-mono text-[10px] text-[#17221d]/45">{moves.length} MOVES</p></div>
    <div className="mt-3 min-h-14 border-y border-[#17221d]/10 py-2">{moves.length ? <div className="flex flex-wrap gap-1">{moves.map((move, index) => <button key={`${move}-${index}`} onClick={() => commit(moves.filter((_, itemIndex) => itemIndex !== index))} className="inline-flex items-center gap-1 border border-[#17221d]/20 bg-[#f4f0e8] px-1.5 py-1 font-mono text-[10px] font-bold hover:border-[#d95743] hover:text-[#8b2d21]">{move}<X className="h-3 w-3" /></button>)}</div> : <p className="font-mono text-[10px] text-[#17221d]/45">—</p>}</div>
    <div className="mt-3 grid grid-cols-3 gap-1 sm:grid-cols-4">{BASE_MOVES.map((base) => <div key={base} className="grid grid-cols-3 overflow-hidden border border-[#17221d]/15"><button onClick={() => append(base)} className="move-pad-key">{base}</button><button onClick={() => append(`${base}'`)} className="move-pad-key">′</button><button onClick={() => append(`${base}2`)} className="move-pad-key">2</button></div>)}</div>
    <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => commit(moves.slice(0, -1))} disabled={!moves.length} className="scanner-button scanner-secondary disabled:opacity-35"><Undo2 className="h-3.5 w-3.5" />UNDO</button><button onClick={() => commit([])} disabled={!moves.length} className="scanner-button scanner-secondary disabled:opacity-35"><RotateCcw className="h-3.5 w-3.5" />CLEAR</button></div>
    <div className="mt-3 flex gap-2"><input value={pasteValue} onChange={(event) => setPasteValue(event.target.value)} placeholder={pasteLabel} className="min-w-0 flex-1 border-2 border-[#17221d]/15 bg-[#f4f0e8] px-3 py-2 font-mono text-xs outline-none focus:border-[#1ba77a]" /><button onClick={appendPaste} disabled={!readMoves(pasteValue).length} className="scanner-button disabled:opacity-35">ADD</button></div>
  </section>;
}
