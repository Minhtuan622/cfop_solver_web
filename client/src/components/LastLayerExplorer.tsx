/** Xưởng Cơ Khí Tốc Độ — one last-layer catalog drawer, shared with the Study SRS store. */
import { Dices, Search } from "lucide-react";
import { useMemo, useState } from "react";
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

  return <section className="card"><div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2"><div><h2 className="h5 mb-0">Last Layer · Catalog</h2><small className="text-body-secondary">{vi ? "Tra cứu & chọn case" : "Browse & select cases"}</small></div><span className="badge text-bg-secondary">{masteredKeys.size}/{catalog.length} ✓</span></div><div className="card-body"><div className="row g-3"><div className="col-12 col-md-6"><label className="form-label">{vi ? "Loại case" : "Case family"}<select value={family} onChange={(event) => switchFamily(event.target.value as Family)} className="form-select mt-1"><option value="all">ALL · ZBLL + 1LLL</option><option value="zbll">ZBLL</option><option value="1lll">1LLL</option></select></label></div><div className="col-12 col-md-6"><label className="form-label">{vi ? "Nhóm case" : "Case group"}<select value={group} onChange={(event) => setGroup(event.target.value)} className="form-select mt-1"><option value="all">{vi ? "Tất cả nhóm" : "All groups"}</option>{groups.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div><div className="col-12"><label className="form-label">{vi ? "Tìm case" : "Search cases"}<div className="input-group mt-1"><span className="input-group-text"><Search className="fs-5" /></span><input value={query} onChange={(event) => setQuery(event.target.value.slice(0, 80))} placeholder={vi ? "Tìm ID, nhóm, công thức" : "Search ID, group, algorithm"} className="form-control" /></div></label></div></div><div className="d-flex flex-wrap gap-2 mt-3"><button type="button" onClick={() => setOnlyUnmastered((value) => !value)} className={onlyUnmastered ? "btn btn-primary" : "btn btn-outline-secondary"}>{onlyUnmastered ? (vi ? "Chỉ chưa thuộc" : "Unmastered") : (vi ? "Tất cả case" : "All cases")}</button><button type="button" onClick={pickRandom} disabled={!unmasteredCount} className="btn btn-outline-primary"><Dices className="fs-5 me-1" />{vi ? "Luyện ngẫu nhiên" : "Random practice"}</button><span className="small text-body-secondary align-self-center">{unmasteredCount} {vi ? "chưa thuộc" : "unmastered"}</span></div><details className="mt-3"><summary className="fw-semibold">{vi ? `Tiến độ nhóm · ${groups.length}` : `Group progress · ${groups.length}`}</summary><div className="mt-3">{groupProgress.map((item) => { const percent = item.total ? Math.round((item.mastered / item.total) * 100) : 0; return <div key={item.name} className="mb-3"><div className="d-flex justify-content-between small"><span>{item.name}</span><span>{item.mastered}/{item.total}</span></div><div className="progress"><div className="progress-bar" style={{ width: `${percent}%` }}>{percent}%</div></div></div>; })}</div></details><div className="list-group mt-3">{scoped.length ? scoped.slice(0, 48).map((item) => { const mastered = masteredKeys.has(keyOf(item)); const active = selectedCase?.id === item.id; return <button key={`${item.family}:${item.id}`} type="button" onClick={() => onSelect(item)} className={active ? "list-group-item list-group-item-action active" : "list-group-item list-group-item-action"}><span className="d-flex justify-content-between align-items-center gap-2"><span><strong>{item.id}</strong><small className="d-block">{item.family.toUpperCase()} · {item.group}</small></span>{mastered && <span className={active ? "badge text-bg-light" : "badge text-bg-success"}>✓</span>}</span></button>; }) : <div className="alert alert-secondary mb-0">{vi ? "Không có case phù hợp bộ lọc." : "No cases match this filter."}</div>}</div></div></section>;
}
