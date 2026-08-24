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
  return <section className="card mt-3"><div className="card-body"><div className="d-flex align-items-center justify-content-between gap-3"><label className="form-label mb-0">{label}</label><span className="badge text-bg-secondary">{moves.length} moves</span></div><div className="border rounded p-2 mt-3">{moves.length ? <div className="d-flex flex-wrap gap-1">{moves.map((move, index) => <button key={`${move}-${index}`} type="button" onClick={() => commit(moves.filter((_, itemIndex) => itemIndex !== index))} className="btn btn-outline-secondary btn-sm">{move}<X className="fs-6 ms-1" /></button>)}</div> : <span className="text-body-secondary">—</span>}</div><div className="row g-2 mt-2">{BASE_MOVES.map((base) => <div key={base} className="col-12 col-sm-6"><div className="btn-group w-100"><button type="button" onClick={() => append(base)} className="btn btn-outline-secondary btn-sm">{base}</button><button type="button" onClick={() => append(`${base}'`)} className="btn btn-outline-secondary btn-sm">′</button><button type="button" onClick={() => append(`${base}2`)} className="btn btn-outline-secondary btn-sm">2</button></div></div>)}</div><div className="d-flex flex-wrap gap-2 mt-3"><button type="button" onClick={() => commit(moves.slice(0, -1))} disabled={!moves.length} className="btn btn-outline-secondary btn-sm"><Undo2 className="fs-5 me-1" />Undo</button><button type="button" onClick={() => commit([])} disabled={!moves.length} className="btn btn-outline-secondary btn-sm"><RotateCcw className="fs-5 me-1" />Clear</button></div><div className="input-group mt-3"><input value={pasteValue} onChange={(event) => setPasteValue(event.target.value)} placeholder={pasteLabel} className="form-control" /><button type="button" onClick={appendPaste} disabled={!readMoves(pasteValue).length} className="btn btn-primary">Add</button></div></div></section>;
}
