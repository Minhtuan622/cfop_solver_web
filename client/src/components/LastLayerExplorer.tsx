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
    return matchesFamily && matchesGroup && matchesQuery && (!onlyUnmastered || !masteredKeys.has(keyOf(item)));
  }), [catalog, family, group, query, onlyUnmastered, masteredKeys]);
  const unmasteredCount = useMemo(() => scoped.filter((item) => !masteredKeys.has(keyOf(item))).length, [scoped, masteredKeys]);
  const groupProgress = useMemo(() => groups.map((name) => {
    const items = catalog.filter((item) => item.group === name && (family === "all" || item.family === family));
    return { name, mastered: items.filter((item) => masteredKeys.has(keyOf(item))).length, total: items.length };
  }), [catalog, family, groups, masteredKeys]);
  const pickRandom = () => { const candidates = scoped.filter((item) => !masteredKeys.has(keyOf(item))); if (candidates.length) onSelect(candidates[Math.floor(Math.random() * candidates.length)]); };
  const switchFamily = (next: Family) => { onFamily(next); setGroup("all"); };

  return <section className="card" aria-labelledby="last-layer-catalog-title"><div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2"><div><h2 id="last-layer-catalog-title" className="h5 mb-0">{vi ? "Last Layer · Catalog" : "Last Layer · Catalog"}</h2><p className="small text-body-secondary mb-0">{vi ? "Tra cứu và chọn case" : "Browse and select a case"}</p></div><span className="badge text-bg-secondary">{masteredKeys.size}/{catalog.length} {vi ? "đã thuộc" : "mastered"}</span></div><div className="card-body">
    <div className="row g-2"><div className="col-12 col-md-6"><label className="form-label" htmlFor="last-layer-family">{vi ? "Loại case" : "Case family"}</label><select id="last-layer-family" value={family} onChange={(event) => switchFamily(event.target.value as Family)} className="form-select"><option value="all">ALL · ZBLL + 1LLL</option><option value="zbll">ZBLL</option><option value="1lll">1LLL</option></select></div><div className="col-12 col-md-6"><label className="form-label" htmlFor="last-layer-group">{vi ? "Nhóm" : "Group"}</label><select id="last-layer-group" value={group} onChange={(event) => setGroup(event.target.value)} className="form-select"><option value="all">{vi ? "Tất cả nhóm" : "All groups"}</option>{groups.map((item) => <option key={item} value={item}>{item}</option>)}</select></div></div>
    <label className="form-label mt-3" htmlFor="last-layer-search">{vi ? "Tìm case" : "Find a case"}</label><div className="input-group"><span className="input-group-text" aria-hidden="true"><Search className="fs-5" /></span><input id="last-layer-search" value={query} onChange={(event) => setQuery(event.target.value.slice(0, 80))} placeholder={vi ? "Tìm ID, nhóm, công thức" : "Search ID, group, algorithm"} className="form-control" /></div>
    <div className="d-flex flex-wrap gap-2 mt-3"><button type="button" onClick={() => setOnlyUnmastered((value) => !value)} className={onlyUnmastered ? "btn btn-primary" : "btn btn-outline-primary"} aria-pressed={onlyUnmastered}>{onlyUnmastered ? (vi ? "Chỉ case chưa thuộc" : "Unmastered only") : (vi ? "Tất cả case" : "All cases")} <span className="badge text-bg-light ms-1">{unmasteredCount}</span></button><button type="button" onClick={pickRandom} disabled={!unmasteredCount} className="btn btn-outline-secondary"><Dices className="fs-5 me-1" />{vi ? "Chọn ngẫu nhiên" : "Pick random"}</button></div>
    <details className="mt-3"><summary className="small fw-semibold">{vi ? `Tiến độ nhóm (${groups.length})` : `Group progress (${groups.length})`}</summary><div className="vstack gap-2 mt-2">{groupProgress.map((item) => { const percent = item.total ? Math.round((item.mastered / item.total) * 100) : 0; return <div key={item.name}><div className="d-flex justify-content-between small"><span>{item.name}</span><span>{item.mastered}/{item.total}</span></div><div className="progress" role="progressbar" aria-label={`${item.name} progress`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div className="progress-bar" style={{ width: `${percent}%` }}>{percent}%</div></div></div>; })}</div></details>
    <div className="list-group mt-3" aria-label={vi ? "Danh sách case" : "Case list"}>{scoped.length ? scoped.slice(0, 48).map((item) => { const mastered = masteredKeys.has(keyOf(item)); const active = selectedCase?.id === item.id && selectedCase.family === item.family; return <button key={keyOf(item)} type="button" onClick={() => onSelect(item)} className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${active ? "active" : ""}`} aria-current={active ? "true" : undefined}><span><span className="d-block fw-semibold">{item.id}</span><small className={active ? "text-white-50" : "text-body-secondary"}>{item.family.toUpperCase()} · {item.group}</small></span>{mastered ? <span className={active ? "badge text-bg-light" : "badge text-bg-success"}>{vi ? "Đã thuộc" : "Mastered"}</span> : <span className={active ? "badge text-bg-light" : "badge text-bg-secondary"}>{vi ? "Chưa thuộc" : "New"}</span>}</button>; }) : <div className="alert alert-secondary mb-0" role="status">{vi ? "Không có case phù hợp với bộ lọc hiện tại." : "No cases match the current filters."}</div>}</div>
  </div></section>;
}
