/** Xưởng Cơ Khí Tốc Độ — one last-layer catalog drawer, shared with the Study SRS store. */
import { Dices, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { LastLayerCatalogCase } from "@/lib/solverRuntime";

type Family = "all" | "zbll" | "1lll";
type Props = {
  language: "vi" | "en";
  catalog: LastLayerCatalogCase[];
  family: Family;
  selectedCase: LastLayerCatalogCase | null;
  masteredKeys: Set<string>;
  onFamily: (family: Family) => void;
  onSelect: (catalogCase: LastLayerCatalogCase) => void;
};

const keyOf = (catalogCase: LastLayerCatalogCase) => `${catalogCase.family}:${catalogCase.id}`;

export function LastLayerExplorer({ language, catalog, family, selectedCase, masteredKeys, onFamily, onSelect }: Props) {
  const vi = language === "vi";
  const [group, setGroup] = useState("all");
  const [query, setQuery] = useState("");
  const [onlyUnmastered, setOnlyUnmastered] = useState(false);
  const groups = useMemo(() => Array.from(new Set(catalog.filter((item) => family === "all" || item.family === family).map((item) => item.group))).sort((a, b) => a.localeCompare(b)), [catalog, family]);
  const scoped = useMemo(() => catalog.filter((item) => {
    const matchesFamily = family === "all" || item.family === family;
    const matchesGroup = group === "all" || item.group === group;
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || `${item.id} ${item.group} ${item.algorithm}`.toLowerCase().includes(needle);
    const unmastered = !masteredKeys.has(keyOf(item));
    return matchesFamily && matchesGroup && matchesQuery && (!onlyUnmastered || unmastered);
  }), [catalog, family, group, query, onlyUnmastered, masteredKeys]);
  const unmasteredCount = useMemo(() => scoped.filter((item) => !masteredKeys.has(keyOf(item))).length, [scoped, masteredKeys]);
  const groupProgress = useMemo(() => groups.map((name) => {
    const items = catalog.filter((item) => item.group === name && (family === "all" || item.family === family));
    const mastered = items.filter((item) => masteredKeys.has(keyOf(item))).length;
    return { name, mastered, total: items.length };
  }), [catalog, family, groups, masteredKeys]);
  const pickRandom = () => {
    const candidates = scoped.filter((item) => !masteredKeys.has(keyOf(item)));
    if (candidates.length) onSelect(candidates[Math.floor(Math.random() * candidates.length)]);
  };
  const switchFamily = (next: Family) => { onFamily(next); setGroup("all"); };

  return <section className="border-2 border-[#17221d] bg-white p-4">
    <div className="d-flex align-items-start justify-content-between gap-3"><div><p className="font-monospace text-[9px] fw-bold text-[#1ba77a]">LAST LAYER · CATALOG</p><p className="mt-1 text-sm fw-bold">{vi ? "Tra cứu & chọn case" : "Browse & select cases"}</p></div><span className="border border-[#17221d]/20 bg-[#f4f0e8] px-2 py-1 font-monospace text-[9px] fw-bold">{masteredKeys.size}/{catalog.length} ✓</span></div>
    <div className="mt-3 d-grid gap-2"><select value={family} onChange={(event) => switchFamily(event.target.value as Family)} aria-label={vi ? "Loại Last Layer" : "Last Layer family"} className="border border-[#17221d]/25 bg-[#f4f0e8] px-2 font-monospace text-[9px] fw-bold"><option value="all">ALL · ZBLL + 1LLL</option><option value="zbll">ZBLL</option><option value="1lll">1LLL</option></select><select value={group} onChange={(event) => setGroup(event.target.value)} aria-label={vi ? "Nhóm case" : "Case group"} className="border border-[#17221d]/25 bg-[#f4f0e8] px-2 font-monospace text-[9px] fw-bold"><option value="all">{vi ? "NHÓM · TẤT CẢ" : "GROUP · ALL"}</option>{groups.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
    <label className="mt-2 d-flex align-items-center gap-2 border border-[#17221d]/20 bg-[#f4f0e8] px-2"><Search className="text-[#17221d]/45" /><input value={query} onChange={(event) => setQuery(event.target.value.slice(0, 80))} placeholder={vi ? "Tìm ID, nhóm, công thức" : "Search ID, group, algorithm"} className="flex-grow-1 bg-transparent font-monospace text-[9px]" /></label>
    <div className="mt-2 d-grid gap-2"><button type="button" onClick={() => setOnlyUnmastered((value) => !value)} className={cn("border px-2 text-start font-monospace text-[8px] fw-bold", onlyUnmastered ? "border bg-success text-success" : "border bg-white text-body")}><span className="d-block">{onlyUnmastered ? (vi ? "CHỈ CHƯA THUỘC" : "UNMASTERED") : (vi ? "TẤT CẢ CASE" : "ALL CASES")}</span><span className="d-block text-[#17221d]/45">{unmasteredCount} {vi ? "chưa thuộc" : "unmastered"}</span></button><button type="button" onClick={pickRandom} disabled={!unmasteredCount} title={vi ? "Chọn case chưa thuộc ngẫu nhiên" : "Pick a random unmastered case"} className="d-grid border-2 border-[#17221d] bg-[#17221d] text-[#1ba77a]"><Dices className="" /></button></div>
    <details className="mt-3 border-y border-[#17221d]/12 py-2"><summary className="font-monospace text-[8px] fw-bold text-[#17221d]/55">{vi ? `TIẾN ĐỘ NHÓM · ${groups.length}` : `GROUP PROGRESS · ${groups.length}`}</summary><div className="mt-2">{groupProgress.map((item) => { const percent = item.total ? Math.round((item.mastered / item.total) * 100) : 0; return <div key={item.name}><div className="d-flex justify-content-between font-monospace text-[8px]"><span>{item.name}</span><b>{percent}%</b></div><div className="mt-1 bg-[#17221d]/10"><span className="d-block h-100 bg-[#1ba77a]" style={{ width: `${percent}%` }} /></div></div>; })}</div></details>
    <div className="mt-3 overflow-auto border-y border-[#17221d]/12">{scoped.length ? scoped.slice(0, 48).map((item) => { const mastered = masteredKeys.has(keyOf(item)); return <button key={`${item.family}:${item.id}`} type="button" onClick={() => onSelect(item)} className={cn("d-flex w-100 align-items-center justify-content-between gap-2 border-b border px-2 py-2 text-start", selectedCase?.id === item.id ? "bg-success" : "hover:bg-[#f4f0e8]")}><span className=""><b className="d-block text-truncate font-monospace text-[9px]">{item.id}</b><span className="font-monospace text-[8px] text-[#17221d]/50">{item.family.toUpperCase()} · {item.group}</span></span><span className="font-monospace text-[10px] text-[#1b7b5e]">{mastered ? "✓" : ""}</span></button>; }) : <p className="p-3 font-monospace text-[9px] text-[#17221d]/55">{vi ? "Không có case phù hợp bộ lọc." : "No cases match this filter."}</p>}</div>
  </section>;
}
