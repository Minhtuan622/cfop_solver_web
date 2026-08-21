/** Xưởng Cơ Khí Tốc Độ — Timer Lab is an operational solve station, with scramble, clock and solution readout. */
import { Check, ClipboardCheck, Dices, Play, RotateCcw, TimerReset, X } from "lucide-react";
import { Link } from "wouter";
import { useMemo, useState } from "react";
import { CubeNet } from "@/components/CubeNet";
import { SolveTimer } from "@/components/SolveTimer";
import { SOLVED_FAST_STATE, stateFromScramble } from "@/lib/fastCube";
import { addSolveHistory } from "@/lib/solveHistory";
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

export default function TimerLab() {
  const { language, setLanguage } = useLanguage();
  const [scramble, setScramble] = useState(newScramble);
  const [solution, setSolution] = useState("");
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [timerVersion, setTimerVersion] = useState(0);
  const [check, setCheck] = useState<"idle" | "correct" | "incorrect" | "invalid">("idle");
  const [saved, setSaved] = useState(false);
  const state = useMemo(() => { try { return stateFromScramble(scramble); } catch { return SOLVED_FAST_STATE; } }, [scramble]);
  const copy = language === "vi" ? {
    title: "Timer Lab", back: "Về Studio", history: "Lịch sử", eyebrow: "TRẠM LUYỆN GIẢI", subtitle: "Tạo scramble, bấm giờ, rồi nộp chuỗi solution để đối chiếu state.",
    scramble: "SCRAMBLE", new: "Tạo scramble mới", guide: "CÁCH DÙNG", steps: ["Đọc scramble và thực hiện trên cube thật.", "Chạy timer bằng Space hoặc nút điều khiển.", "Dừng timer, nhập chuỗi solution bạn đã dùng.", "Đối chiếu để xác nhận cube về trạng thái solved."],
    solution: "SOLUTION CỦA BẠN", placeholder: "Ví dụ: R U R' U' ...", verify: "Đối chiếu solution", waiting: "Dừng timer rồi nộp solution để ghi lượt.", correct: "Đúng — solution đưa cube về solved.", incorrect: "Chưa solved — kiểm tra lại chuỗi solution.", invalid: "Không đọc được notation — dùng U, R, F, D, L, B với ' hoặc 2.", saved: "Đã ghi lượt hợp lệ vào Lịch sử.", reset: "Làm lại lượt này", moves: "NƯỚC", status: "TRẠNG THÁI"
  } : {
    title: "Timer Lab", back: "Back to Studio", history: "History", eyebrow: "SOLVE TRAINING STATION", subtitle: "Generate a scramble, time the solve, then submit your solution to verify the state.",
    scramble: "SCRAMBLE", new: "Generate new scramble", guide: "OPERATION", steps: ["Read the scramble and apply it to your physical cube.", "Run the timer with Space or the controls.", "Stop the timer and enter the solution you used.", "Verify that your solution returns the cube to solved."],
    solution: "YOUR SOLUTION", placeholder: "Example: R U R' U' ...", verify: "Verify solution", waiting: "Stop the timer, then submit a solution to log this solve.", correct: "Verified — your solution returns the cube to solved.", incorrect: "Not solved — check the solution sequence.", invalid: "Notation could not be read — use U, R, F, D, L, B with ' or 2.", saved: "Valid solve logged to History.", reset: "Reset this attempt", moves: "MOVES", status: "STATUS"
  };
  const refresh = () => { setScramble(newScramble()); setSolution(""); setElapsed(null); setCheck("idle"); setSaved(false); setTimerVersion((value) => value + 1); };
  const verify = () => {
    if (elapsed === null || !solution.trim()) return;
    try {
      const correct = stateFromScramble(`${scramble} ${solution}`) === SOLVED_FAST_STATE;
      setCheck(correct ? "correct" : "incorrect");
      if (correct && !saved) { addSolveHistory({ elapsedMs: elapsed, input: scramble, inputKind: "scramble", moves: moveCount(solution) }); setSaved(true); }
    } catch { setCheck("invalid"); }
  };
  const message = check === "correct" ? copy.correct : check === "incorrect" ? copy.incorrect : check === "invalid" ? copy.invalid : copy.waiting;

  return <main className="history-surface min-h-screen bg-[#f4f0e8] px-4 py-5 text-[#17221d] sm:px-8"><div className="mx-auto max-w-6xl pb-16">
    <header className="history-header relative overflow-hidden border-2 border-[#17221d] bg-[#17221d] p-5 text-[#f4f0e8] shadow-[8px_8px_0_#1ba77a] sm:p-6"><div className="tick-ruler" /><div className="relative flex flex-wrap items-center justify-between gap-5"><div className="flex items-center gap-3"><img src="/manus-storage/cfop-studio-mark_62473f8e.png" alt="CFOP Solver Studio" className="h-12 w-12 rounded-sm bg-[#f4f0e8] p-1" /><div><p className="wordmark font-mono text-[11px] font-bold uppercase text-[#1ba77a] sm:text-xs"><span>CF</span><span className="wordmark-o">O</span><span>P</span><span className="ml-1 text-[#f4f0e8]/80">Solver Studio</span></p><h1 className="mt-1 text-3xl font-black tracking-[-0.06em]">{copy.title}</h1></div></div><div className="flex items-center gap-2"><button onClick={() => setLanguage("vi")} className={`history-lang ${language === "vi" ? "history-lang-active" : ""}`}>VI</button><button onClick={() => setLanguage("en")} className={`history-lang ${language === "en" ? "history-lang-active" : ""}`}>EN</button><Link href="/history" className="history-back">{copy.history}</Link><Link href="/" className="history-back">{copy.back}</Link></div></div></header>
    <section className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_330px]"><div className="space-y-7"><section className="history-panel border-2 border-[#17221d] bg-white p-5 sm:p-7"><div className="tick-ruler tick-ruler-ink" /><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#1ba77a]">{copy.eyebrow}</p><p className="mt-2 max-w-xl text-sm leading-6 text-[#17221d]/65">{copy.subtitle}</p></div><span className="font-mono text-[10px] font-bold tracking-[0.16em] text-[#17221d]/50">20 {copy.moves}</span></div><div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]"><div className="rounded-sm border-2 border-[#17221d] bg-[#17221d] p-5 text-[#f4f0e8]"><p className="font-mono text-[10px] font-bold tracking-[0.18em] text-[#1ba77a]">{copy.scramble}</p><p className="mt-3 break-words font-mono text-xl font-bold leading-8 tracking-[0.04em]">{scramble}</p><div className="mt-5 flex flex-wrap gap-2"><button onClick={refresh} className="scanner-button"><Dices className="h-4 w-4" />{copy.new}</button><button onClick={() => { navigator.clipboard?.writeText(scramble); }} className="scanner-button scanner-secondary"><ClipboardCheck className="h-4 w-4" />COPY</button></div></div><div className="scorecard grid place-items-center rounded-sm border-2 border-[#17221d] bg-[#e9e3d6] p-4"><CubeNet state={state} /></div></div></section>
      <section className="history-panel border-2 border-[#17221d] bg-white p-5 sm:p-7"><div className="tick-ruler tick-ruler-ink" /><div className="grid gap-7 lg:grid-cols-[280px_minmax(0,1fr)]"><div><SolveTimer key={timerVersion} onComplete={setElapsed} /><button onClick={refresh} className="mt-3 scanner-button scanner-secondary w-full"><TimerReset className="h-4 w-4" />{copy.reset}</button></div><div><div className="flex items-center justify-between"><label className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#17221d]/60">{copy.solution}</label><span className="font-mono text-[10px] text-[#1b7b5e]">{moveCount(solution)} {copy.moves}</span></div><textarea value={solution} onChange={(event) => { setSolution(event.target.value); setCheck("idle"); setSaved(false); }} spellCheck={false} placeholder={copy.placeholder} className="mt-2 min-h-32 w-full resize-none rounded-sm border-2 border-[#17221d]/20 bg-[#f4f0e8] p-4 font-mono text-sm leading-6 outline-none transition focus:border-[#1ba77a] focus:ring-4 focus:ring-[#1ba77a]/15" /><button disabled={elapsed === null || !solution.trim()} onClick={verify} className="scanner-button mt-3 disabled:opacity-40"><Play className="h-4 w-4 fill-current" />{copy.verify}</button><div className={`mt-4 flex items-start gap-3 border-2 p-4 font-mono text-xs leading-5 ${check === "correct" ? "border-[#1ba77a] bg-[#1ba77a]/10 text-[#125a43]" : check === "incorrect" || check === "invalid" ? "border-[#d95743] bg-[#d95743]/10 text-[#8b2d21]" : "border-[#17221d]/15 bg-[#e9e3d6] text-[#17221d]/60"}`}>{check === "correct" ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : check === "idle" ? <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <X className="mt-0.5 h-4 w-4 shrink-0" />}<span>{message}</span></div>{saved && <p className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1b7b5e]">✓ {copy.saved}</p>}</div></div></section></div>
      <aside className="history-panel h-fit border-2 border-[#17221d] bg-[#e9e3d6] p-5"><div className="tick-ruler tick-ruler-ink" /><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#1ba77a]">{copy.guide}</p><ol className="mt-4 space-y-3">{copy.steps.map((step, index) => <li key={step} className="grid grid-cols-[30px_1fr] gap-3 border-b border-[#17221d]/12 pb-3"><span className="grid h-7 w-7 place-items-center bg-[#17221d] font-mono text-xs font-bold text-[#f4f0e8]">0{index + 1}</span><span className="text-sm leading-5 text-[#17221d]/70">{step}</span></li>)}</ol></aside></section>
  </div></main>;
}
