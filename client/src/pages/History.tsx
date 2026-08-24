/** Bootstrap analytics workspace: History remains read-only and derives insights from the canonical Timer store. */
import { ArrowLeft, BarChart3, Clock3, Play, Tag } from "@/components/BootstrapIcon";
import { Link } from "wouter";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { effectiveTime, formatSolveResult, formatSolveTime, readSolveHistory, type SolveHistoryEntry } from "@/lib/solveHistory";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMemo, useState, type ReactNode } from "react";

function average(values: number[]) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }

export default function History() {
  const { language } = useLanguage();
  const [entries] = useState<SolveHistoryEntry[]>(() => readSolveHistory());
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("all");
  const vi = language === "vi";
  const label = (viText: string, enText: string) => vi ? viText : enText;
  const tags = useMemo(() => Array.from(new Set(entries.flatMap((item) => item.tags))).sort((a, b) => a.localeCompare(b)), [entries]);
  const filtered = useMemo(() => entries.filter((item) => {
    const haystack = `${item.input} ${item.note} ${item.tags.join(" ")}`.toLocaleLowerCase();
    return (tag === "all" || item.tags.includes(tag)) && (!query.trim() || haystack.includes(query.trim().toLocaleLowerCase()));
  }), [entries, query, tag]);
  const valid = useMemo(() => filtered.flatMap((item) => {
    const time = effectiveTime(item);
    return time === null ? [] : [time];
  }), [filtered]);
  const best = valid.length ? Math.min(...valid) : 0;
  const dnfCount = filtered.filter((item) => item.penalty === "DNF").length;
  const plusTwoCount = filtered.filter((item) => item.penalty === "+2").length;
  const chart = useMemo(() => filtered.slice(0, 30).reverse().map((item, index) => ({ solve: index + 1, seconds: Number(((effectiveTime(item) ?? item.elapsedMs) / 1000).toFixed(2)) })), [filtered]);

  return <main className="container py-4"><section className="card"><div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2"><div><p className="small text-uppercase fw-semibold text-body-secondary mb-1">CFOP Solver Studio · {label("Phân tích", "Analytics")}</p><h1 className="h3 mb-0">{label("History & phân tích solve", "History & solve analysis")}</h1></div><Link href="/timer" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"><ArrowLeft className="fs-6" />{label("Về Timer", "Back to Timer")}</Link></div><div className="card-body">{entries.length ? <><section className="row g-3" aria-label={label("Chỉ số lịch sử", "History metrics")}><Metric label={label("Best single", "Best single")} value={formatSolveTime(best)} icon={<Clock3 className="fs-5" />} /><Metric label={label("Trung bình đang lọc", "Filtered average")} value={formatSolveTime(average(valid))} icon={<BarChart3 className="fs-5" />} /><Metric label={label("Solve hợp lệ", "Valid solves")} value={`${valid.length}/${filtered.length}`} icon={<Clock3 className="fs-5" />} /><Metric label={label("Phạt", "Penalties")} value={`+2 ${plusTwoCount} · DNF ${dnfCount}`} icon={<Tag className="fs-5" />} /></section><section className="card mt-4"><div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2"><div><h2 className="h5 mb-0">{label("Xu hướng 30 solve gần nhất", "Last 30-solve trend")}</h2><p className="small text-body-secondary mb-0">{label("DNF hiển thị theo thời gian gốc để không làm đứt đường xu hướng.", "DNF uses base time to keep the trend connected.")}</p></div><span className="badge text-bg-light">{filtered.length} {label("lượt", "solves")}</span></div><div className="card-body"><div style={{ height: "18rem" }}><ResponsiveContainer width="100%" height="100%"><LineChart data={chart}><XAxis dataKey="solve" axisLine={false} tickLine={false} /><YAxis tickFormatter={(value) => `${value}s`} axisLine={false} tickLine={false} width={42} /><Tooltip formatter={(value) => [`${value}s`, label("Thời gian", "Time")]} /><Line type="monotone" dataKey="seconds" stroke="#0d6efd" strokeWidth={3} dot={{ fill: "#0d6efd", r: 4 }} /></LineChart></ResponsiveContainer></div></div></section><section className="card mt-4"><div className="card-header"><h2 className="h5 mb-0">{label("Danh sách có thể lọc", "Filterable solve list")}</h2></div><div className="card-body"><div className="row g-2"><div className="col-12 col-md"><label className="visually-hidden" htmlFor="history-search">{label("Tìm scramble, ghi chú hoặc tag", "Search scramble, note, or tag")}</label><div className="input-group"><span className="input-group-text"><BarChart3 className="fs-6" /></span><input id="history-search" className="form-control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={label("Tìm scramble, ghi chú hoặc tag", "Search scramble, note, or tag")} /></div></div><div className="col-12 col-md-auto"><label className="visually-hidden" htmlFor="history-tag">{label("Lọc tag", "Filter tag")}</label><select id="history-tag" className="form-select" value={tag} onChange={(event) => setTag(event.target.value)}><option value="all">{label("Mọi tag", "All tags")}</option>{tags.map((item) => <option key={item} value={item}>{item}</option>)}</select></div></div></div><div className="list-group list-group-flush">{filtered.length ? filtered.slice(0, 100).map((item) => <SolveRow key={item.id} item={item} language={language} />) : <div className="list-group-item"><div className="alert alert-secondary mb-0">{label("Không có solve phù hợp với bộ lọc này.", "No solves match this filter.")}</div></div>}</div></section></> : <div className="alert alert-info mb-0"><div className="d-flex align-items-start gap-3"><BarChart3 className="fs-3 flex-shrink-0" /><div><h2 className="h5">{label("Nhật ký Timer đang trống.", "Timer history is empty.")}</h2><p className="mb-3">{label("Khi bạn hoàn thành một lượt trong Timer Lab, phân tích xu hướng và danh sách solve sẽ hiện ở đây.", "When you complete a Timer Lab solve, its trend and detail will appear here.")}</p><Link href="/timer" className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"><Play className="fs-6" />{label("Mở Timer", "Open Timer")}</Link></div></div></div>}</div></section></main>;
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) { return <div className="col-12 col-md-6 col-xl-3"><div className="card bg-body-tertiary h-100"><div className="card-body d-flex align-items-start justify-content-between gap-3"><div><small className="text-body-secondary d-block">{label}</small><strong className="fs-5 d-block mt-1">{value}</strong></div><span className="text-body-secondary">{icon}</span></div></div></div>; }

function SolveRow({ item, language }: { item: SolveHistoryEntry; language: "vi" | "en" }) {
  const vi = language === "vi";
  return <article className="list-group-item"><div className="row g-2 align-items-center"><div className="col"><p className="font-monospace text-break mb-1">{item.inputKind === "scramble" ? item.input : (vi ? "State 6 mặt" : "6-face state")}</p><p className="small text-body-secondary mb-0">{new Date(item.createdAt).toLocaleString(vi ? "vi-VN" : "en-US")} · {item.moves} {vi ? "nước xoay" : "moves"}{item.note ? ` · ${item.note}` : ""}</p>{item.tags.length ? <div className="d-flex flex-wrap gap-1 mt-2">{item.tags.map((tag) => <span key={tag} className="badge text-bg-secondary">{tag}</span>)}</div> : null}</div><div className="col-auto text-end"><strong className={item.penalty === "DNF" ? "text-danger" : ""}>{formatSolveResult(item)}</strong>{item.inspectionMs ? <small className="d-block text-body-secondary">Inspection {(item.inspectionMs / 1000).toFixed(1)}s</small> : null}</div></div></article>;
}
