/**
 * Xưởng Cơ Khí Tốc Độ — asymmetrical workbench, mono telemetry and cube-state
 * signals make the CFOP solution readable as an instrument panel.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, Braces, Check, ChevronRight, CircleGauge,
  Cpu, Loader2, Play, RotateCcw, ShieldCheck, Sparkles,
} from "lucide-react";
import { CubeNet, SOLVED_STATE } from "@/components/CubeNet";
import { cn } from "@/lib/utils";
import { solveInBrowser, type SolverResult } from "@/lib/solverRuntime";

const DEFAULT_SCRAMBLE = "R U R' U'";
const PHASE_COLORS: Record<string, string> = {
  cross: "bg-[#e7c34f] text-[#17221d]",
  f2l_FR: "bg-[#ed8e42] text-[#17221d]",
  f2l_FL: "bg-[#d95743] text-white",
  f2l_BL: "bg-[#3b6fc7] text-white",
  f2l_BR: "bg-[#1ba77a] text-[#17221d]",
  oll: "bg-[#f4f0e8] text-[#17221d]",
  pll: "bg-[#17221d] text-[#f4f0e8]",
};

function displayPhase(name: string) {
  if (name.startsWith("f2l_")) return `F2L · ${name.replace("f2l_", "")}`;
  return name.toUpperCase();
}

export default function Home() {
  const [mode, setMode] = useState<"scramble" | "state">("scramble");
  const [value, setValue] = useState(DEFAULT_SCRAMBLE);
  const [result, setResult] = useState<SolverResult | null>(null);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  const currentState = useMemo(() => {
    if (!result) return mode === "state" && value.length === 54 ? value : SOLVED_STATE;
    return cursor === 0 ? result.initial_state : result.trace[cursor - 1]?.state ?? result.final_state;
  }, [cursor, mode, result, value]);
  const currentStep = result?.trace[cursor - 1];
  const activePhase = cursor > 0
    ? result?.phases.find((phase) => cursor > phase.start && cursor <= phase.end)
      ?? result?.phases.find((phase) => phase.end === cursor)
      ?? null
    : null;
  const totalMoves = result?.trace.length ?? 0;

  useEffect(() => {
    if (!playing || !result) return;
    const id = window.setInterval(() => {
      setCursor((previous) => {
        if (previous >= result.trace.length) {
          setPlaying(false);
          return previous;
        }
        return previous + 1;
      });
    }, 260);
    return () => window.clearInterval(id);
  }, [playing, result]);

  async function runSolver() {
    setLoading(true);
    setPlaying(false);
    setError("");
    try {
      const next = await solveInBrowser(mode, value.trim());
      setResult(next);
      setCursor(0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể chạy solver với đầu vào này.");
    } finally {
      setLoading(false);
    }
  }

  const phaseCount = result?.phases.filter((phase) => phase.moves.length > 0).length ?? 0;
  const updateCursor = (next: number) => { setPlaying(false); setCursor(next); };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f0e8] text-[#17221d]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="relative overflow-hidden rounded-[1.15rem] border-2 border-[#17221d] bg-[#17221d] px-5 py-5 text-[#f4f0e8] shadow-[8px_8px_0_#1ba77a] sm:px-7">
          <img src="/manus-storage/cfop-blueprint-detail_a81f8345.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.14] mix-blend-screen" />
          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <img src="/manus-storage/cfop-studio-mark_62473f8e.png" alt="CFOP Solver Studio" className="h-14 w-14 rounded-xl bg-[#f4f0e8] p-1.5" />
              <div>
                <p className="wordmark font-mono text-[10px] font-bold uppercase tracking-[0.29em] text-[#1ba77a]">CFOP Solver Studio</p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.065em] sm:text-3xl">Mở từng pha, không bỏ qua state.</h1>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-[#f4f0e8]/20 bg-[#f4f0e8]/5 px-4 py-2 font-mono text-[11px]">
              <span className="h-2 w-2 rounded-full bg-[#1ba77a] shadow-[0_0_0_4px_rgba(27,167,122,0.18)]" />
              FULL OLL 57 · PLL 21
            </div>
          </div>
        </header>

        <section className="mt-7 grid gap-7 xl:grid-cols-[330px_minmax(0,1fr)_360px]">
          <aside className="space-y-5 xl:sticky xl:top-5 xl:h-fit">
            <div className="scorecard overflow-hidden rounded-[1rem] border-2 border-[#17221d] bg-white shadow-[6px_6px_0_#17221d]">
              <img src="/manus-storage/cfop-hero-cube_823c9f74.png" alt="Speedcube trên bàn kỹ thuật" className="h-32 w-full object-cover" />
              <div className="p-5">
                <div className="flex items-center justify-between"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#1ba77a]">Input workbench</p><Cpu className="h-4 w-4" /></div>
                <div className="mt-4 grid grid-cols-2 rounded-lg border border-[#17221d]/15 p-1">
                  {(["scramble", "state"] as const).map((item) => <button key={item} onClick={() => { setMode(item); setError(""); }} className={cn("rounded-md px-2 py-2 font-mono text-[11px] font-bold uppercase transition", mode === item ? "bg-[#17221d] text-[#f4f0e8]" : "text-[#17221d]/55 hover:bg-[#f4f0e8]")}>{item === "scramble" ? "Scramble" : "State 54"}</button>)}
                </div>
                <label className="mt-5 block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#17221d]/60">{mode === "scramble" ? "Singmaster notation" : "U R F D L B · 54 stickers"}</label>
                <textarea value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} className="mt-2 min-h-28 w-full resize-none rounded-lg border border-[#17221d]/20 bg-[#f4f0e8] p-3 font-mono text-sm leading-6 outline-none transition focus:border-[#1ba77a] focus:ring-4 focus:ring-[#1ba77a]/15" />
                {error && <p className="mt-3 rounded-lg bg-[#d95743]/10 p-3 font-mono text-xs leading-5 text-[#9b3023]">{error}</p>}
                <button disabled={loading || !value.trim()} onClick={runSolver} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1ba77a] px-4 py-3 text-sm font-bold text-[#10241c] transition hover:-translate-y-0.5 hover:bg-[#24bd8d] active:scale-[0.97] disabled:opacity-60">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Nạp Python verifier…</> : <><Sparkles className="h-4 w-4" />Chạy full CFOP</>}
                </button>
              </div>
            </div>
            <div className="scorecard rounded-[1rem] border-2 border-[#17221d] bg-[#e9e3d6] p-5"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#17221d]/55">Verifier</p><p className="mt-2 text-lg font-bold leading-tight">Python solver chạy cục bộ trong browser.</p><p className="mt-2 text-sm leading-5 text-[#17221d]/65">Không gửi scramble hoặc state tới server. Lần đầu nạp Python có thể mất một lúc; mỗi pha chỉ commit sau khi invariant và postcondition đạt.</p></div>
          </aside>

          <section className="min-w-0">
            <div className="scorecard rounded-[1.15rem] border-2 border-[#17221d] bg-white p-5 shadow-[8px_8px_0_rgba(23,34,29,0.14)] sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#1ba77a]">Live state · {String(cursor).padStart(2, "0")} / {String(totalMoves).padStart(2, "0")}</p><h2 className="mt-2 text-3xl font-bold tracking-[-0.055em] sm:text-4xl">{activePhase ? displayPhase(activePhase.name) : "Sẵn sàng quan sát"}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#17221d]/60">{currentStep ? `Vừa áp dụng ${currentStep.move}. Dùng control để phát, dừng hoặc duyệt lần lượt từng move.` : "Nhập scramble rồi chạy solver. Cube net sẽ ghi lại từng state ngay khi algorithm chuyển pha."}</p></div>
                <div className="rounded-xl border border-[#17221d]/15 bg-[#f4f0e8] px-4 py-3 font-mono text-xs"><p className="text-[#17221d]/45">CURRENT MOVE</p><p className="mt-1 text-2xl font-bold text-[#1ba77a]">{currentStep?.move ?? "—"}</p></div>
              </div>
              <div className="mt-8 grid place-items-center rounded-[1.4rem] border border-dashed border-[#17221d]/25 bg-[#efe9dc] px-5 py-10" style={{ backgroundImage: "linear-gradient(rgba(23,34,29,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(23,34,29,.05) 1px, transparent 1px)", backgroundSize: "24px 24px" }}><CubeNet state={currentState} /></div>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button onClick={() => updateCursor(Math.max(0, cursor - 1))} disabled={cursor === 0} className="control-button"><ArrowLeft className="h-4 w-4" />Trước</button>
                <button onClick={() => setPlaying((value) => !value)} disabled={!result || cursor === totalMoves} className="flex items-center gap-2 rounded-lg bg-[#17221d] px-5 py-3 text-sm font-bold text-[#f4f0e8] transition hover:bg-[#26372e] active:scale-[0.97] disabled:opacity-40">{playing ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}{playing ? "Dừng" : "Phát state"}</button>
                <button onClick={() => updateCursor(Math.min(totalMoves, cursor + 1))} disabled={!result || cursor === totalMoves} className="control-button">Sau<ArrowRight className="h-4 w-4" /></button>
                <button onClick={() => { setCursor(0); setPlaying(false); }} disabled={!result} className="ml-auto flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#17221d]/55 transition hover:text-[#17221d] disabled:opacity-40"><RotateCcw className="h-3.5 w-3.5" />Reset trace</button>
              </div>
              <div className="mt-5 flex items-center gap-4"><input aria-label="Chọn move trong trace" type="range" min="0" max={Math.max(0, totalMoves)} value={cursor} onChange={(event) => updateCursor(Number(event.target.value))} className="accent-[#1ba77a]" /><span className="min-w-16 text-right font-mono text-xs font-bold">{cursor} moves</span></div>
            </div>
            <div className="scorecard mt-7 rounded-[1rem] border-2 border-[#17221d] bg-[#17221d] p-5 text-[#f4f0e8] sm:p-6"><div className="tick-ruler" /><div className="flex items-center justify-between gap-4"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#1ba77a]">Move rail</p><p className="mt-1 text-lg font-bold">Sequence đã chuẩn hóa</p></div><Braces className="h-5 w-5 text-[#f4f0e8]/55" /></div><div className="mt-4 flex flex-wrap gap-1.5">{result ? result.trace.map((step, index) => <button key={`${step.index}-${step.move}`} onClick={() => updateCursor(index + 1)} className={cn("rounded-md px-2 py-1 font-mono text-xs transition", cursor === index + 1 ? "bg-[#1ba77a] font-bold text-[#17221d]" : "bg-white/10 text-[#f4f0e8]/75 hover:bg-white/20")}>{step.move}</button>) : <span className="font-mono text-xs text-[#f4f0e8]/45">Sequence xuất hiện sau lần solve đầu tiên.</span>}</div></div>
          </section>

          <aside className="space-y-5 xl:sticky xl:top-5 xl:h-[calc(100vh-2.5rem)] xl:overflow-auto xl:pr-2">
            <div className="grid grid-cols-3 gap-2"><Stat label="MOVES" value={result ? String(totalMoves) : "—"} icon={<CircleGauge className="h-4 w-4" />} /><Stat label="PHASES" value={result ? String(phaseCount) : "—"} icon={<ChevronRight className="h-4 w-4" />} /><Stat label="VALID" value={result ? "YES" : "—"} icon={<ShieldCheck className="h-4 w-4" />} /></div>
            <div className="telemetry-panel rounded-[1rem] border-2 border-[#17221d] bg-white p-4 shadow-[5px_5px_0_rgba(23,34,29,0.13)]"><div className="flex items-center justify-between"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#17221d]/55">CFOP timeline</p><span className="font-mono text-[10px] text-[#1ba77a]">INVARIANT LOCK</span></div><div className="mt-4 space-y-2">{result ? result.phases.map((phase) => { const selected = activePhase?.name === phase.name || cursor === phase.end; return <button key={phase.name} onClick={() => updateCursor(phase.end)} className={cn("group flex w-full items-center gap-3 rounded-md border p-3 text-left transition", selected ? "border-[#1ba77a] bg-[#1ba77a]/10" : "border-[#17221d]/10 hover:border-[#17221d] hover:bg-[#f4f0e8]")}><span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-sm font-mono text-[11px] font-bold", PHASE_COLORS[phase.name] ?? "bg-[#17221d] text-white")}>{phase.name === "oll" ? "O" : phase.name === "pll" ? "P" : phase.name.startsWith("f2l") ? "F" : "X"}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{displayPhase(phase.name)}</span><span className="block truncate font-mono text-[10px] text-[#17221d]/50">{phase.moves.length} moves {phase.case_id && phase.case_id !== "solved" ? `· case ${phase.case_id}` : ""}</span></span><Check className="h-4 w-4 text-[#1ba77a]" /></button>; }) : ["Cross", "F2L × 4", "OLL 57", "PLL 21"].map((label, index) => <div key={label} className="flex items-center gap-3 rounded-md border border-[#17221d]/10 bg-[#f4f0e8] p-3 text-[#17221d]/45"><span className="grid h-9 w-9 place-items-center rounded-sm bg-white font-mono text-xs">0{index + 1}</span><span className="text-sm font-bold">{label}</span></div>)}</div></div>
            <div className="telemetry-panel rounded-[1rem] border-2 border-[#17221d] bg-[#e9e3d6] p-5"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#17221d]/55">Database status</p><div className="mt-3 space-y-2 font-mono text-xs"><div className="flex justify-between border-b-2 border-[#17221d]/10 pb-2"><span>OLL fingerprint</span><b>57 / 57</b></div><div className="flex justify-between border-b-2 border-[#17221d]/10 pb-2"><span>PLL fingerprint</span><b>21 / 21</b></div><div className="flex justify-between"><span>AUF coverage</span><b className="text-[#1b7b5e]">4 × all cases</b></div></div></div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div className="telemetry-panel rounded-md border-2 border-[#17221d] bg-white p-3 shadow-[3px_3px_0_rgba(23,34,29,0.12)]"><div className="flex items-center justify-between text-[#17221d]/45">{icon}<span className="font-mono text-[8px] font-bold tracking-[0.12em]">{label}</span></div><p className="mt-2 font-mono text-xl font-bold tracking-[-0.08em]">{value}</p></div>;
}
