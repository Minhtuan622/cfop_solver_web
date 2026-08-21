/** Xưởng Cơ Khí Tốc Độ — Timer Lab is an operational solve station, with scramble, clock and solution readout. */
import { Check, ClipboardCheck, Delete, Download, Dices, Eraser, Play, TimerReset, X } from "lucide-react";
import { Link } from "wouter";
import { useMemo, useState } from "react";
import { CubeNet } from "@/components/CubeNet";
import { SolveTimer } from "@/components/SolveTimer";
import { SOLVED_FAST_STATE, stateFromScramble } from "@/lib/fastCube";
import { addSolveHistory, formatSolveTime, readSolveHistory, type SolveHistoryEntry } from "@/lib/solveHistory";
import { useLanguage } from "@/contexts/LanguageContext";

const FACES = ["U", "R", "F", "D", "L", "B"];
const SUFFIXES = ["", "2", "'"];

function sameAxis(a: string, b: string) {
  const axis = (face: string) => (face === "U" || face === "D" ? 0 : face === "R" || face === "L" ? 1 : 2);
  return axis(a) === axis(b);
}
function newScramble() {
  const moves: string[] = [];
  while (moves.length < 20) {
    const face = FACES[Math.floor(Math.random() * FACES.length)];
    const previous = moves.at(-1)?.[0];
    const beforePrevious = moves.at(-2)?.[0];
    if (face === previous || (previous && beforePrevious && sameAxis(face, previous) && sameAxis(face, beforePrevious))) continue;
    moves.push(face + SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]);
  }
  return moves.join(" ");
}

function moveCount(text: string) { return text.trim() ? text.trim().split(/\s+/).length : 0; }
function averageOfFive(entries: SolveHistoryEntry[]) {
  if (entries.length < 5) return null;
  const sample = entries.slice(0, 5).map((entry) => entry.elapsedMs).sort((a, b) => a - b);
  return (sample[1] + sample[2] + sample[3]) / 3;
}
function csvCell(value: string | number) { return `"${String(value).replaceAll('"', '""')}"`; }

export default function TimerLab() {
  const { language, setLanguage } = useLanguage();
  const [scramble, setScramble] = useState(newScramble);
  const [solution, setSolution] = useState("");
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [timerVersion, setTimerVersion] = useState(0);
  const [check, setCheck] = useState<"idle" | "correct" | "incorrect" | "invalid">("idle");
  const [saved, setSaved] = useState(false);
  const [entries, setEntries] = useState<SolveHistoryEntry[]>(() => readSolveHistory());
  const state = useMemo(() => { try { return stateFromScramble(scramble); } catch { return SOLVED_FAST_STATE; } }, [scramble]);
  const copy = language === "vi" ? {
    title: "Timer Lab", back: "Về Studio", eyebrow: "TRẠM LUYỆN GIẢI", subtitle: "Scramble, bấm giờ và ghi nhận thành tích ngay tại một nơi.",
    scramble: "SCRAMBLE", new: "Tạo scramble mới", solution: "SOLUTION CỦA BẠN", placeholder: "Ví dụ: R U R' U' ...", verify: "Đối chiếu solution", waiting: "Solution là tùy chọn; lượt được lưu ngay khi timer dừng.", correct: "Đúng — solution đưa cube về solved.", incorrect: "Chưa solved — kiểm tra lại chuỗi solution.", invalid: "Không đọc được notation — dùng U, R, F, D, L, B với ' hoặc 2.", saved: "Đã tự lưu lượt giải vào nhật ký.", reset: "Làm lại lượt này", moves: "NƯỚC", stats: "THỐNG KÊ CÁ NHÂN", history: "NHẬT KÝ LƯỢT GIẢI", pb: "PB", ao5: "AO5", total: "LƯỢT", export: "Xuất CSV", empty: "Chưa có lượt nào được lưu. Dừng timer để ghi lượt đầu tiên.", date: "THỜI ĐIỂM", time: "THỜI GIAN"
  } : {
    title: "Timer Lab", back: "Back to Studio", eyebrow: "SOLVE TRAINING STATION", subtitle: "Scramble, time and record your results in one place.",
    scramble: "SCRAMBLE", new: "Generate new scramble", solution: "YOUR SOLUTION", placeholder: "Example: R U R' U' ...", verify: "Verify solution", waiting: "Solution is optional; the solve is saved as soon as the timer stops.", correct: "Verified — your solution returns the cube to solved.", incorrect: "Not solved — check the solution sequence.", invalid: "Notation could not be read — use U, R, F, D, L, B with ' or 2.", saved: "Solve saved to the session log.", reset: "Reset this attempt", moves: "MOVES", stats: "PERSONAL METRICS", history: "SOLVE LOG", pb: "PB", ao5: "AO5", total: "SOLVES", export: "Export CSV", empty: "No solves saved yet. Stop the timer to record your first solve.", date: "STAMP", time: "TIME"
  };
  const refresh = () => { setScramble(newScramble()); setSolution(""); setElapsed(null); setCheck("idle"); setSaved(false); setTimerVersion((value) => value + 1); };
  const appendMove = (move: string) => { setSolution((previous) => `${previous.trim()}${previous.trim() ? " " : ""}${move}`); setCheck("idle"); };
  const removeMove = () => setSolution((previous) => previous.trim().split(/\s+/).slice(0, -1).join(" "));
  const verify = () => {
    if (elapsed === null || !solution.trim()) return;
    try {
      const correct = stateFromScramble(`${scramble} ${solution}`) === SOLVED_FAST_STATE;
      setCheck(correct ? "correct" : "incorrect");
    } catch { setCheck("invalid"); }
  };
  const recordSolve = (elapsedMs: number) => {
    const item = addSolveHistory({ elapsedMs, input: scramble, inputKind: "scramble", moves: 0 });
    setElapsed(elapsedMs); setEntries((previous) => [item, ...previous].slice(0, 100)); setSaved(true); setCheck("idle");
  };
  const exportCsv = () => {
    const header = ["timestamp", "time_ms", "time", "scramble", "moves"];
    const rows = entries.map((item) => [new Date(item.createdAt).toISOString(), item.elapsedMs, formatSolveTime(item.elapsedMs), item.input, item.moves]);
    const blob = new Blob([[header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "cfop-timer-history.csv"; link.click(); URL.revokeObjectURL(url);
  };
  const message = check === "correct" ? copy.correct : check === "incorrect" ? copy.incorrect : check === "invalid" ? copy.invalid : copy.waiting;
  const pb = entries.length ? Math.min(...entries.map((entry) => entry.elapsedMs)) : null;
  const ao5 = averageOfFive(entries);

  return <main className="timer-lab history-surface min-h-screen bg-[#f4f0e8] px-4 py-5 text-[#17221d] sm:px-8"><div className="mx-auto max-w-6xl pb-16">
    <header className="history-header relative overflow-hidden border-2 border-[#17221d] bg-[#17221d] p-5 text-[#f4f0e8] shadow-[8px_8px_0_#1ba77a] sm:p-6"><div className="tick-ruler" /><div className="relative flex flex-wrap items-center justify-between gap-5"><div className="flex items-center gap-3"><img src="/manus-storage/cfop-studio-mark_62473f8e.png" alt="CFOP Solver Studio" className="h-12 w-12 rounded-sm bg-[#f4f0e8] p-1" /><div><p className="wordmark font-mono text-[11px] font-bold uppercase text-[#1ba77a] sm:text-xs"><span>CF</span><span className="wordmark-o">O</span><span>P</span><span className="ml-1 text-[#f4f0e8]/80">Solver Studio</span></p><h1 className="mt-1 text-3xl font-black tracking-[-0.06em]">{copy.title}</h1></div></div><div className="flex items-center gap-2"><button onClick={() => setLanguage("vi")} className={`history-lang ${language === "vi" ? "history-lang-active" : ""}`}>VI</button><button onClick={() => setLanguage("en")} className={`history-lang ${language === "en" ? "history-lang-active" : ""}`}>EN</button><Link href="/" className="history-back">{copy.back}</Link></div></div></header>
    <section className="mt-7 space-y-7"><section className="history-panel border-2 border-[#17221d] bg-white p-5 sm:p-7"><div className="tick-ruler tick-ruler-ink" /><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#1ba77a]">{copy.eyebrow}</p><p className="mt-2 max-w-xl text-sm leading-6 text-[#17221d]/65">{copy.subtitle}</p></div><span className="font-mono text-[10px] font-bold tracking-[0.16em] text-[#17221d]/50">20 {copy.moves}</span></div><div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]"><div className="rounded-sm border-2 border-[#17221d] bg-[#17221d] p-5 text-[#f4f0e8]"><p className="font-mono text-[10px] font-bold tracking-[0.18em] text-[#1ba77a]">{copy.scramble}</p><p className="mt-3 break-words font-mono text-xl font-bold leading-8 tracking-[0.04em]">{scramble}</p><div className="mt-5 flex flex-wrap gap-2"><button onClick={refresh} className="scanner-button"><Dices className="h-4 w-4" />{copy.new}</button><button onClick={() => { navigator.clipboard?.writeText(scramble); }} className="scanner-button scanner-secondary"><ClipboardCheck className="h-4 w-4" />COPY</button></div></div><div className="scorecard grid place-items-center rounded-sm border-2 border-[#17221d] bg-[#e9e3d6] p-4"><CubeNet state={state} /></div></div></section>
      <section className="history-panel border-2 border-[#17221d] bg-white p-5 sm:p-7"><div className="tick-ruler tick-ruler-ink" /><div className="grid gap-7 lg:grid-cols-[280px_minmax(0,1fr)]"><div><SolveTimer key={timerVersion} onComplete={recordSolve} /><button onClick={refresh} className="mt-3 scanner-button scanner-secondary w-full"><TimerReset className="h-4 w-4" />{copy.reset}</button>{saved && <p className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1b7b5e]">✓ {copy.saved}</p>}</div><div><div className="flex items-center justify-between"><label className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#17221d]/60">{copy.solution}</label><span className="font-mono text-[10px] text-[#1b7b5e]">{moveCount(solution)} {copy.moves}</span></div><div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">{FACES.map((face) => <div key={face} className="grid grid-cols-3 overflow-hidden rounded-sm border border-[#17221d]/25 bg-white"><button onClick={() => appendMove(face)} className="p-2 font-mono text-xs font-bold hover:bg-[#1ba77a]/20">{face}</button><button onClick={() => appendMove(`${face}'`)} className="border-l border-[#17221d]/15 p-2 font-mono text-xs hover:bg-[#1ba77a]/20">{face}'</button><button onClick={() => appendMove(`${face}2`)} className="border-l border-[#17221d]/15 p-2 font-mono text-xs hover:bg-[#1ba77a]/20">{face}2</button></div>)}</div><textarea value={solution} onChange={(event) => { setSolution(event.target.value); setCheck("idle"); }} spellCheck={false} placeholder={copy.placeholder} className="mt-3 min-h-24 w-full resize-none rounded-sm border-2 border-[#17221d]/20 bg-[#f4f0e8] p-4 font-mono text-sm leading-6 outline-none transition focus:border-[#1ba77a] focus:ring-4 focus:ring-[#1ba77a]/15" /><div className="mt-3 flex flex-wrap gap-2"><button onClick={removeMove} disabled={!solution.trim()} className="scanner-button scanner-secondary disabled:opacity-40"><Delete className="h-4 w-4" />{language === "vi" ? "Xóa nước cuối" : "Undo move"}</button><button onClick={() => { setSolution(""); setCheck("idle"); }} disabled={!solution.trim()} className="scanner-button scanner-secondary disabled:opacity-40"><Eraser className="h-4 w-4" />{language === "vi" ? "Xóa chuỗi" : "Clear"}</button><button disabled={elapsed === null || !solution.trim()} onClick={verify} className="scanner-button disabled:opacity-40"><Play className="h-4 w-4 fill-current" />{copy.verify}</button></div><div className={`mt-4 flex items-start gap-3 border-2 p-4 font-mono text-xs leading-5 ${check === "correct" ? "border-[#1ba77a] bg-[#1ba77a]/10 text-[#125a43]" : check === "incorrect" || check === "invalid" ? "border-[#d95743] bg-[#d95743]/10 text-[#8b2d21]" : "border-[#17221d]/15 bg-[#e9e3d6] text-[#17221d]/60"}`}>{check === "correct" ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : check === "idle" ? <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <X className="mt-0.5 h-4 w-4 shrink-0" />}<span>{message}</span></div></div></div></section>
      <section className="grid gap-7 xl:grid-cols-[300px_minmax(0,1fr)]"><div className="history-panel border-2 border-[#17221d] bg-[#e9e3d6] p-5"><div className="tick-ruler tick-ruler-ink" /><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#1ba77a]">{copy.stats}</p><div className="mt-4 grid grid-cols-3 gap-2"><div className="border-2 border-[#17221d] bg-white p-3"><p className="font-mono text-[9px] text-[#17221d]/50">{copy.pb}</p><b className="mt-1 block font-mono text-lg">{pb === null ? "--:--" : formatSolveTime(pb)}</b></div><div className="border-2 border-[#17221d] bg-white p-3"><p className="font-mono text-[9px] text-[#17221d]/50">{copy.ao5}</p><b className="mt-1 block font-mono text-lg">{ao5 === null ? "--:--" : formatSolveTime(ao5)}</b></div><div className="border-2 border-[#17221d] bg-white p-3"><p className="font-mono text-[9px] text-[#17221d]/50">{copy.total}</p><b className="mt-1 block font-mono text-lg">{entries.length}</b></div></div></div><div className="history-panel border-2 border-[#17221d] bg-white p-5"><div className="tick-ruler tick-ruler-ink" /><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#1ba77a]">{copy.history}</p><button disabled={!entries.length} onClick={exportCsv} className="scanner-button scanner-secondary disabled:opacity-40"><Download className="h-4 w-4" />{copy.export}</button></div>{entries.length ? <div className="mt-4 divide-y divide-[#17221d]/10">{entries.slice(0, 12).map((item) => <div key={item.id} className="grid grid-cols-[1fr_auto] gap-4 py-3"><div><p className="font-mono text-xs font-bold">{item.input}</p><p className="mt-1 font-mono text-[10px] text-[#17221d]/55">{new Date(item.createdAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")} · {item.moves} {copy.moves}</p></div><b className="font-mono text-lg">{formatSolveTime(item.elapsedMs)}</b></div>)}</div> : <p className="mt-4 border-2 border-dashed border-[#17221d]/20 bg-[#f4f0e8] p-4 text-sm text-[#17221d]/60">{copy.empty}</p>}</div></section></section>
  </div></main>;
}
