/** Xưởng Cơ Khí Tốc Độ — focused OLL/PLL recall drill with local-only performance records. */
import { useEffect, useMemo, useState } from "react";
import { Check, Eye, RotateCcw, TimerReset, X } from "lucide-react";
import { OLL_CASES, PLL_CASES, type PracticeCase } from "@/lib/practiceCases";

type Kind = "OLL" | "PLL";
type Stats = { correct: number; mistakes: number; totalSeconds: number };
const EMPTY: Stats = { correct: 0, mistakes: 0, totalSeconds: 0 };
const STORE = "cfop-practice-stats-v1";

function randomCase(kind: Kind, previous?: string) {
  const pool = kind === "OLL" ? OLL_CASES : PLL_CASES;
  const candidates = pool.filter((item) => `${item.kind}-${item.id}` !== previous);
  return candidates[Math.floor(Math.random() * candidates.length)] as PracticeCase;
}

function format(seconds: number) { return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}.${Math.floor((seconds % 1) * 10)}`; }

export function PracticeLab() {
  const [kind, setKind] = useState<Kind>("OLL");
  const [caseData, setCaseData] = useState<PracticeCase>(() => randomCase("OLL"));
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState<Stats>(EMPTY);
  const startRef = useState(() => performance.now())[0];
  const [startedAt, setStartedAt] = useState(startRef);

  useEffect(() => { const saved = localStorage.getItem(STORE); if (saved) setStats(JSON.parse(saved) as Stats); }, []);
  useEffect(() => { if (!running) return; const id = window.setInterval(() => setElapsed((performance.now() - startedAt) / 1000), 80); return () => window.clearInterval(id); }, [running, startedAt]);
  const attempts = stats.correct + stats.mistakes;
  const accuracy = attempts ? Math.round((stats.correct / attempts) * 100) : 0;
  const avg = attempts ? stats.totalSeconds / attempts : 0;
  const bank = useMemo(() => kind === "OLL" ? OLL_CASES : PLL_CASES, [kind]);

  function next(nextKind = kind) { const item = randomCase(nextKind, `${caseData.kind}-${caseData.id}`); setKind(nextKind); setCaseData(item); setElapsed(0); setStartedAt(performance.now()); setRunning(true); setRevealed(false); }
  function record(correct: boolean) { const duration = elapsed; const nextStats = { correct: stats.correct + (correct ? 1 : 0), mistakes: stats.mistakes + (correct ? 0 : 1), totalSeconds: stats.totalSeconds + duration }; setStats(nextStats); localStorage.setItem(STORE, JSON.stringify(nextStats)); setRunning(false); setRevealed(true); }
  function resetStats() { setStats(EMPTY); localStorage.removeItem(STORE); }

  return <section className="scorecard practice-sheet rounded-[1rem] border-2 border-[#17221d] bg-white p-5 sm:p-6">
    <div className="tick-ruler tick-ruler-ink" />
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#1ba77a]">Practice lab</p><h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">Nhận case. Gọi algorithm.</h2></div><div className="rounded-md bg-[#17221d] px-3 py-2 font-mono text-xs text-[#f4f0e8]"><TimerReset className="mr-1 inline h-3.5 w-3.5 text-[#1ba77a]" />{format(elapsed)}</div></div>
    <div className="mt-4 flex gap-2">{(["OLL", "PLL"] as Kind[]).map((item) => <button key={item} onClick={() => next(item)} className={`rounded-md border-2 px-3 py-2 font-mono text-xs font-bold ${kind === item ? "border-[#17221d] bg-[#17221d] text-[#f4f0e8]" : "border-[#17221d]/15 bg-[#f4f0e8]"}`}>{item} · {item === "OLL" ? 57 : 21}</button>)}</div>
    <div className="mt-4 rounded-lg border-2 border-[#17221d] bg-[#efe9dc] p-5"><div className="flex items-center justify-between"><span className="font-mono text-xs font-bold text-[#17221d]/50">CASE CUE</span><span className="rounded-sm bg-[#1ba77a] px-2 py-1 font-mono text-[10px] font-bold text-[#17221d]">{caseData.group}</span></div><p className="mt-3 font-mono text-5xl font-bold tracking-[-0.08em]">{caseData.kind} {caseData.id}</p><p className="mt-2 text-sm text-[#17221d]/60">Tự nhận diện pattern, thực hiện algorithm trên cube thật, rồi tự chấm kết quả.</p>{revealed && <pre className="mt-4 overflow-x-auto rounded-md bg-[#17221d] p-3 font-mono text-xs leading-6 text-[#f4f0e8]">{caseData.algorithm}</pre>}</div>
    <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => setRevealed(true)} className="scanner-button scanner-secondary"><Eye className="h-3.5 w-3.5" />Hiện algorithm</button><button onClick={() => record(true)} disabled={!running} className="scanner-button"><Check className="h-3.5 w-3.5" />Đúng</button><button onClick={() => record(false)} disabled={!running} className="scanner-button scanner-secondary"><X className="h-3.5 w-3.5" />Lỗi</button><button onClick={() => next()} className="scanner-button scanner-secondary"><RotateCcw className="h-3.5 w-3.5" />Case mới</button></div>
    <div className="mt-5 grid grid-cols-3 gap-2 border-t-2 border-[#17221d]/10 pt-4"><Metric label="ATTEMPTS" value={String(attempts)} /><Metric label="ACCURACY" value={`${accuracy}%`} /><Metric label="AVG TIME" value={format(avg)} /></div>
    <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-[#17221d]/45"><span>{bank.length} cases in active bank · lưu trên thiết bị này</span><button onClick={resetStats} className="underline hover:text-[#17221d]">Reset stats</button></div>
  </section>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-md border border-[#17221d]/15 bg-[#f4f0e8] p-3"><p className="font-mono text-[9px] font-bold tracking-[0.12em] text-[#17221d]/45">{label}</p><p className="mt-1 font-mono text-lg font-bold">{value}</p></div>; }
