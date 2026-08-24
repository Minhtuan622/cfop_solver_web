/** Visual OLL/PLL drills made from the verified setup inverse and saved local practice outcomes. */
import { useEffect, useMemo, useState } from "react";
import { Check, Eye, Play, RotateCcw, TimerReset, X } from "@/components/BootstrapIcon";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { OLL_CASES, PLL_CASES, type PracticeCase } from "@/lib/practiceCases";
import { CubeNet, SOLVED_STATE } from "@/components/CubeNet";
import { getCaseStateInBrowser } from "@/lib/solverRuntime";
import { useLanguage } from "@/contexts/LanguageContext";

type Kind = "OLL" | "PLL";
type Attempt = { kind: Kind; seconds: number; correct: boolean; createdAt: number };
type Stats = { correct: number; mistakes: number; totalSeconds: number; history: Attempt[] };
const EMPTY: Stats = { correct: 0, mistakes: 0, totalSeconds: 0, history: [] };
const STORE = "cfop-practice-stats-v2";

function randomCase(kind: Kind, previous?: string) { const pool = kind === "OLL" ? OLL_CASES : PLL_CASES; const candidates = pool.filter((item) => `${item.kind}-${item.id}` !== previous); return candidates[Math.floor(Math.random() * candidates.length)] as PracticeCase; }
function format(seconds: number) { return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}.${Math.floor((seconds % 1) * 10)}`; }

export function PracticeLab() {
  const { t, language } = useLanguage();
  const [kind, setKind] = useState<Kind>("OLL");
  const [caseData, setCaseData] = useState<PracticeCase>(() => randomCase("OLL"));
  const [caseState, setCaseState] = useState(SOLVED_STATE);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState<Stats>(EMPTY);
  const [startedAt, setStartedAt] = useState(performance.now());

  useEffect(() => { const saved = localStorage.getItem(STORE); if (saved) { const legacy = JSON.parse(saved) as Partial<Stats>; setStats({ ...EMPTY, ...legacy, history: legacy.history ?? [] }); } }, []);
  useEffect(() => { let live = true; setPreviewLoading(true); getCaseStateInBrowser(caseData.setup).then((state) => { if (live) setCaseState(state); }).catch(() => { if (live) setCaseState(SOLVED_STATE); }).finally(() => { if (live) setPreviewLoading(false); }); return () => { live = false; }; }, [caseData]);
  useEffect(() => { if (!running) return; const id = window.setInterval(() => setElapsed((performance.now() - startedAt) / 1000), 80); return () => window.clearInterval(id); }, [running, startedAt]);
  const attempts = stats.correct + stats.mistakes;
  const accuracy = attempts ? Math.round((stats.correct / attempts) * 100) : 0;
  const avg = attempts ? stats.totalSeconds / attempts : 0;
  const history = useMemo(() => stats.history.slice(-12).map((item, index) => ({ attempt: index + 1, seconds: Number(item.seconds.toFixed(1)), kind: item.kind, correct: item.correct })), [stats.history]);
  const label = language === "vi" ? { image: "Hình case", setup: "Cách tạo case", solve: "Cách giải case", start: "Bắt đầu bấm giờ", new: "Case mới", loading: "Đang tạo hình case…" } : { image: "Case image", setup: "Make this case", solve: "Solve this case", start: "Start timer", new: "New case", loading: "Drawing case image…" };

  function next(nextKind = kind) { const item = randomCase(nextKind, `${caseData.kind}-${caseData.id}`); setKind(nextKind); setCaseData(item); setElapsed(0); setRunning(false); setRevealed(false); }
  function start() { setElapsed(0); setStartedAt(performance.now()); setRunning(true); setRevealed(false); }
  function record(correct: boolean) { const duration = elapsed; const nextStats: Stats = { correct: stats.correct + (correct ? 1 : 0), mistakes: stats.mistakes + (correct ? 0 : 1), totalSeconds: stats.totalSeconds + duration, history: [...stats.history, { kind: caseData.kind, seconds: duration, correct, createdAt: Date.now() }].slice(-60) }; setStats(nextStats); localStorage.setItem(STORE, JSON.stringify(nextStats)); setRunning(false); setRevealed(true); }
  function resetStats() { setStats(EMPTY); localStorage.removeItem(STORE); }

  return <section className="scorecard practice-sheet rounded-[1rem] border-2 border-[#17221d] bg-white p-5 sm:p-6">
    <div className="tick-ruler tick-ruler-ink" />
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#1ba77a]">{t("practice.title")}</p><h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">{t("practice.help")}</h2></div><div className="rounded-md bg-[#17221d] px-3 py-2 font-mono text-xs text-[#f4f0e8]"><TimerReset className="mr-1 inline h-3.5 w-3.5 text-[#1ba77a]" />{format(elapsed)}</div></div>
    <div className="mt-4 flex gap-2">{(["OLL", "PLL"] as Kind[]).map((item) => <button key={item} onClick={() => next(item)} className={`rounded-md border-2 px-3 py-2 font-mono text-xs font-bold ${kind === item ? "border-[#17221d] bg-[#17221d] text-[#f4f0e8]" : "border-[#17221d]/15 bg-[#f4f0e8]"}`}>{item} · {item === "OLL" ? 57 : 21}</button>)}</div>
    <div className="mt-4 grid gap-4 lg:grid-cols-[150px_minmax(0,1fr)]"><div className="case-preview rounded-lg border-2 border-[#17221d] bg-[#17221d] p-3 text-[#f4f0e8]"><p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1ba77a]">{label.image}</p><div className="mt-2 grid place-items-center">{previewLoading ? <span className="font-mono text-[10px] text-[#f4f0e8]/60">{label.loading}</span> : <CubeNet state={caseState} compact />}</div></div><div className="rounded-lg border-2 border-[#17221d] bg-[#efe9dc] p-5"><div className="flex items-center justify-between"><span className="font-mono text-xs font-bold text-[#17221d]/50">CASE</span><span className="rounded-sm bg-[#1ba77a] px-2 py-1 font-mono text-[10px] font-bold text-[#17221d]">{caseData.group}</span></div><p className="mt-3 font-mono text-5xl font-bold tracking-[-0.08em]">{caseData.kind} {caseData.id}</p><p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#17221d]/50">{label.setup}</p><pre className="mt-2 overflow-x-auto rounded-md bg-[#17221d] p-3 font-mono text-xs leading-6 text-[#f4f0e8]">{caseData.setup}</pre>{revealed && <><p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#17221d]/50">{label.solve}</p><pre className="mt-2 overflow-x-auto rounded-md bg-[#1b7b5e] p-3 font-mono text-xs leading-6 text-white">{caseData.algorithm}</pre></>}</div></div>
    <div className="mt-4 flex flex-wrap gap-2"><button onClick={start} disabled={running} className="scanner-button"><Play className="h-3.5 w-3.5 fill-current" />{label.start}</button><button onClick={() => setRevealed(true)} className="scanner-button scanner-secondary"><Eye className="h-3.5 w-3.5" />{t("practice.show")}</button><button onClick={() => record(true)} disabled={!running} className="scanner-button"><Check className="h-3.5 w-3.5" />{t("practice.correct")}</button><button onClick={() => record(false)} disabled={!running} className="scanner-button scanner-secondary"><X className="h-3.5 w-3.5" />{t("practice.wrong")}</button><button onClick={() => next()} className="scanner-button scanner-secondary"><RotateCcw className="h-3.5 w-3.5" />{label.new}</button></div>
    <div className="mt-5 grid grid-cols-3 gap-2 border-t-2 border-[#17221d]/10 pt-4"><Metric label={t("practice.attempts")} value={String(attempts)} /><Metric label={t("practice.accuracy")} value={`${accuracy}%`} /><Metric label={t("practice.average")} value={format(avg)} /></div>
    <div className="mt-5 rounded-lg border border-[#17221d]/15 bg-[#f4f0e8] p-3"><div className="flex items-center justify-between"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">{t("practice.progress")}</p><button onClick={resetStats} className="font-mono text-[10px] text-[#17221d]/50 underline hover:text-[#17221d]">{t("practice.reset")}</button></div>{history.length ? <div className="mt-2 h-36"><ResponsiveContainer width="100%" height="100%"><LineChart data={history}><XAxis dataKey="attempt" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis width={26} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [`${value}s`, language === "vi" ? "Thời gian" : "Time"]} labelFormatter={(value) => `${language === "vi" ? "Lần" : "Try"} ${value}`} /><Line type="monotone" dataKey="seconds" stroke="#1ba77a" strokeWidth={3} dot={{ r: 3, fill: "#17221d" }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div> : <p className="py-6 text-center text-xs text-[#17221d]/55">{t("practice.noData")}</p>}</div>
  </section>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-md border border-[#17221d]/15 bg-[#f4f0e8] p-3"><p className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#17221d]/45">{label}</p><p className="mt-1 font-mono text-lg font-bold">{value}</p></div>; }
