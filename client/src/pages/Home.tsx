/**
 * Xưởng Cơ Khí Tốc Độ — asymmetrical workbench, mono telemetry and cube-state
 * signals make the CFOP solution readable as an instrument panel.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, Braces, Check, ChevronRight, CircleGauge,
  Cpu, Loader2, Play, RotateCcw, ShieldCheck, Sparkles,
} from "lucide-react";
import { Timer } from "lucide-react";
import { Link } from "wouter";
import { CubeNet, SOLVED_STATE } from "@/components/CubeNet";
import { Cube3DGuide } from "@/components/Cube3DGuide";
import { CameraScanner } from "@/components/CameraScanner";
import { stateFromScramble } from "@/lib/fastCube";
import { simplePhase, useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { solveInBrowser, type CrossColor, type SolverResult } from "@/lib/solverRuntime";

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
const CROSS_COLORS: { value: CrossColor; vi: string; en: string; hex: string }[] = [
  { value: "U", vi: "Trắng", en: "White", hex: "#f7f3e9" },
  { value: "D", vi: "Vàng", en: "Yellow", hex: "#e7c34f" },
  { value: "F", vi: "Xanh lá", en: "Green", hex: "#1ba77a" },
  { value: "B", vi: "Xanh dương", en: "Blue", hex: "#3b6fc7" },
  { value: "R", vi: "Đỏ", en: "Red", hex: "#d95743" },
  { value: "L", vi: "Cam", en: "Orange", hex: "#ed8e42" },
];

export default function Home() {
  const { language, setLanguage, t } = useLanguage();
  const [mode, setMode] = useState<"scramble" | "state">("scramble");
  const [crossColor, setCrossColor] = useState<CrossColor>("U");
  const [value, setValue] = useState(DEFAULT_SCRAMBLE);
  const [result, setResult] = useState<SolverResult | null>(null);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  const previewState = useMemo(() => {
    if (mode === "state") return value.length === 54 ? value : SOLVED_STATE;
    try { return value.trim() ? stateFromScramble(value) : SOLVED_STATE; } catch { return SOLVED_STATE; }
  }, [mode, value]);
  const currentState = useMemo(() => {
    if (!result) return previewState;
    return cursor === 0 ? result.initial_state : result.trace[cursor - 1]?.state ?? result.final_state;
  }, [cursor, previewState, result]);
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
      const next = await solveInBrowser(mode, value.trim(), crossColor);
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
        <header className="relative overflow-hidden rounded-[3px] border-2 border-[#17221d] bg-[#17221d] px-5 py-5 text-[#f4f0e8] shadow-[10px_10px_0_#1ba77a] sm:px-7">
          <img src="/manus-storage/cfop-blueprint-detail_a81f8345.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.14] mix-blend-screen" />
          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <img src="/manus-storage/cfop-studio-mark_62473f8e.png" alt="CFOP Solver Studio" className="h-14 w-14 rounded-xl bg-[#f4f0e8] p-1.5" />
              <div>
                <p className="wordmark font-mono text-[11px] font-bold uppercase text-[#1ba77a] sm:text-xs"><span>CF</span><span className="wordmark-o">O</span><span>P</span><span className="ml-1 text-[#f4f0e8]/80">Solver Studio</span></p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.065em] sm:text-3xl">{t("app.tagline")}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-sm border border-[#f4f0e8]/20 bg-[#f4f0e8]/5 px-3 py-2 font-mono text-[11px]">
              <Link href="/timer" className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[#f4f0e8]/75 hover:bg-white/10 hover:text-[#f4f0e8]"><Timer className="h-3 w-3" />Timer Lab</Link>
              <span className="h-2 w-2 rounded-full bg-[#1ba77a] shadow-[0_0_0_4px_rgba(27,167,122,0.18)]" />
              <button onClick={() => setLanguage("vi")} className={cn("rounded px-1.5 py-1", language === "vi" ? "bg-[#1ba77a] text-[#17221d]" : "text-[#f4f0e8]/65")}>VI</button><button onClick={() => setLanguage("en")} className={cn("rounded px-1.5 py-1", language === "en" ? "bg-[#1ba77a] text-[#17221d]" : "text-[#f4f0e8]/65")}>EN</button>
            </div>
          </div>
        </header>

        <section className="mt-7 grid gap-7 xl:grid-cols-[330px_minmax(0,1fr)_360px]">
          <aside className="space-y-5 xl:sticky xl:top-5 xl:h-fit">
            <div className="scorecard overflow-hidden rounded-[3px] border-2 border-[#17221d] bg-white shadow-[7px_7px_0_#17221d]">
              <img src="/manus-storage/cfop-hero-cube_823c9f74.png" alt="Speedcube trên bàn kỹ thuật" className="h-32 w-full object-cover contrast-90 saturate-[.8] mix-blend-multiply" />
              <div className="p-5">
                <div className="flex items-center justify-between"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#1ba77a]">{t("input.title")}</p><Cpu className="h-4 w-4" /></div>
                <div className="mt-4 grid grid-cols-2 rounded-sm border-2 border-[#17221d]/15 p-1">
                  {(["scramble", "state"] as const).map((item) => <button key={item} onClick={() => { setMode(item); setError(""); }} className={cn("rounded-md px-2 py-2 font-mono text-[11px] font-bold uppercase transition", mode === item ? "bg-[#17221d] text-[#f4f0e8]" : "text-[#17221d]/55 hover:bg-[#f4f0e8]")}>{item === "scramble" ? t("input.scramble") : t("input.state")}</button>)}
                </div>
                <div className="mt-4 border-y border-[#17221d]/15 py-3">
                  <div className="flex items-center justify-between gap-3"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#17221d]/60">{language === "vi" ? "MÀU CROSS" : "CROSS COLOR"}</p><span className="font-mono text-[10px] font-bold text-[#1b7b5e]">{language === "vi" ? CROSS_COLORS.find((item) => item.value === crossColor)?.vi : CROSS_COLORS.find((item) => item.value === crossColor)?.en}</span></div>
                  <div className="mt-2 grid grid-cols-6 gap-1.5" role="radiogroup" aria-label={language === "vi" ? "Chọn màu Cross" : "Choose Cross color"}>{CROSS_COLORS.map((item) => <button key={item.value} type="button" role="radio" aria-checked={crossColor === item.value} aria-label={language === "vi" ? `Cross ${item.vi}` : `Cross ${item.en}`} onClick={() => setCrossColor(item.value)} className={cn("grid aspect-square place-items-center rounded-sm border-2 transition", crossColor === item.value ? "border-[#17221d] bg-[#17221d] shadow-[2px_2px_0_#1ba77a]" : "border-[#17221d]/20 bg-white hover:border-[#17221d]")}><span className="h-5 w-5 rounded-sm border border-[#17221d]/40" style={{ backgroundColor: item.hex }} /></button>)}</div>
                  <p className="mt-2 font-mono text-[9px] leading-4 text-[#17221d]/50">{language === "vi" ? "Trắng là mặc định. Solver giữ các bước Cross → F2L → OLL → PLL theo màu đã chọn." : "White is the default. The solver keeps Cross → F2L → OLL → PLL for the selected color."}</p>
                </div>
                <label className="mt-5 block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#17221d]/60">{mode === "scramble" ? t("input.label") : "U R F D L B · 54"}</label>
                <textarea value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} className="mt-2 min-h-28 w-full resize-none rounded-sm border-2 border-[#17221d]/20 bg-[#f4f0e8] p-3 font-mono text-sm leading-6 outline-none transition focus:border-[#1ba77a] focus:ring-4 focus:ring-[#1ba77a]/15" />
                {error && <p className="mt-3 rounded-lg bg-[#d95743]/10 p-3 font-mono text-xs leading-5 text-[#9b3023]">{error}</p>}
                <button disabled={loading || !value.trim()} onClick={runSolver} className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm border-2 border-[#17221d] bg-[#1ba77a] px-4 py-3 text-sm font-bold text-[#10241c] shadow-[3px_3px_0_#17221d] transition hover:-translate-y-0.5 hover:bg-[#24bd8d] active:scale-[0.97] disabled:opacity-60">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" />{t("input.loading")}</> : <><Sparkles className="h-4 w-4" />{t("input.solve")}</>}
                </button>
              </div>
            </div>
            <CameraScanner onState={(state) => { setMode("state"); setValue(state); setResult(null); setCursor(0); setError(""); }} />
          </aside>

          <section className="min-w-0">
            <div className="scorecard rounded-[3px] border-2 border-[#17221d] bg-white p-5 shadow-[9px_9px_0_rgba(23,34,29,0.16)] sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#1ba77a]">{t("guide.step")} · {String(cursor).padStart(2, "0")} / {String(totalMoves).padStart(2, "0")}</p><h2 className="mt-2 text-3xl font-bold tracking-[-0.055em] sm:text-4xl">{activePhase ? simplePhase(activePhase.name, language) : t("guide.ready")}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#17221d]/60">{currentStep ? `${t("guide.move")}: ${currentStep.move}` : t("guide.help")}</p></div>
                <div className="rounded-sm border-2 border-[#17221d]/15 bg-[#f4f0e8] px-4 py-3 font-mono text-xs shadow-[3px_3px_0_rgba(23,34,29,0.12)]"><p className="text-[#17221d]/45">{t("guide.move").toUpperCase()}</p><p className="mt-1 text-2xl font-bold text-[#1ba77a]">{currentStep?.move ?? "—"}</p></div>
              </div>
              <div className="mt-8 grid gap-5 rounded-[3px] border-2 border-dashed border-[#17221d]/25 bg-[#efe9dc] p-5 sm:grid-cols-[minmax(0,1fr)_250px] sm:p-7" style={{ backgroundImage: "linear-gradient(rgba(23,34,29,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(23,34,29,.05) 1px, transparent 1px)", backgroundSize: "24px 24px" }}><div className="grid place-items-center"><CubeNet state={currentState} /></div><Cube3DGuide state={currentState} move={currentStep?.move} step={cursor} crossColor={crossColor} /></div>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button onClick={() => updateCursor(Math.max(0, cursor - 1))} disabled={cursor === 0} className="control-button"><ArrowLeft className="h-4 w-4" />{t("guide.previous")}</button>
                <button onClick={() => setPlaying((value) => !value)} disabled={!result || cursor === totalMoves} className="flex items-center gap-2 rounded-lg bg-[#17221d] px-5 py-3 text-sm font-bold text-[#f4f0e8] transition hover:bg-[#26372e] active:scale-[0.97] disabled:opacity-40">{playing ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}{playing ? t("guide.pause") : t("guide.play")}</button>
                <button onClick={() => updateCursor(Math.min(totalMoves, cursor + 1))} disabled={!result || cursor === totalMoves} className="control-button">{t("guide.next")}<ArrowRight className="h-4 w-4" /></button>
                <button onClick={() => { setCursor(0); setPlaying(false); }} disabled={!result} className="ml-auto flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#17221d]/55 transition hover:text-[#17221d] disabled:opacity-40"><RotateCcw className="h-3.5 w-3.5" />{t("guide.reset")}</button>
              </div>
              <div className="mt-5 flex items-center gap-4"><input aria-label="Chọn move trong trace" type="range" min="0" max={Math.max(0, totalMoves)} value={cursor} onChange={(event) => updateCursor(Number(event.target.value))} className="accent-[#1ba77a]" /><span className="min-w-16 text-right font-mono text-xs font-bold">{cursor} moves</span></div>
            </div>
            <div className="scorecard mt-7 rounded-[1rem] border-2 border-[#17221d] bg-[#17221d] p-5 text-[#f4f0e8] sm:p-6"><div className="tick-ruler" /><div className="flex items-center justify-between gap-4"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#1ba77a]">{t("guide.list")}</p><p className="mt-1 text-lg font-bold">{language === "vi" ? "Chạm vào một nước xoay để xem lại." : "Tap a move to review it."}</p></div><Braces className="h-5 w-5 text-[#f4f0e8]/55" /></div><div className="mt-4 flex flex-wrap gap-1.5">{result ? result.trace.map((step, index) => <button key={`${step.index}-${step.move}`} onClick={() => updateCursor(index + 1)} className={cn("rounded-md px-2 py-1 font-mono text-xs transition", cursor === index + 1 ? "bg-[#1ba77a] font-bold text-[#17221d]" : "bg-white/10 text-[#f4f0e8]/75 hover:bg-white/20")}>{step.move}</button>) : <span className="font-mono text-xs text-[#f4f0e8]/45">{language === "vi" ? "Các nước xoay sẽ hiện ở đây." : "Moves will appear here."}</span>}</div></div>
          </section>

          <aside className="space-y-5 xl:sticky xl:top-5 xl:h-[calc(100vh-2.5rem)] xl:overflow-auto xl:pr-2">
            <div className="grid grid-cols-3 gap-2"><Stat label={t("status.moves")} value={result ? String(totalMoves) : "—"} icon={<CircleGauge className="h-4 w-4" />} /><Stat label={t("status.steps")} value={result ? String(phaseCount) : "—"} icon={<ChevronRight className="h-4 w-4" />} /><Stat label={t("status.ok")} value={result ? "✓" : "—"} icon={<ShieldCheck className="h-4 w-4" />} /></div>
            <div className="telemetry-panel rounded-[1rem] border-2 border-[#17221d] bg-white p-4 shadow-[5px_5px_0_rgba(23,34,29,0.13)]"><div className="flex items-center justify-between"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#17221d]/55">{t("guide.title")}</p><span className="font-mono text-[10px] text-[#1ba77a]">{t("status.ready")}</span></div><div className="mt-4 space-y-2">{result ? result.phases.map((phase) => { const selected = activePhase?.name === phase.name || cursor === phase.end; return <button key={phase.name} onClick={() => updateCursor(phase.end)} className={cn("group flex w-full items-center gap-3 rounded-md border p-3 text-left transition", selected ? "border-[#1ba77a] bg-[#1ba77a]/10" : "border-[#17221d]/10 hover:border-[#17221d] hover:bg-[#f4f0e8]")}><span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-sm font-mono text-[11px] font-bold", PHASE_COLORS[phase.name] ?? "bg-[#17221d] text-white")}>{phase.name === "oll" ? "O" : phase.name === "pll" ? "P" : phase.name.startsWith("f2l") ? "F" : "X"}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{simplePhase(phase.name, language)}</span><span className="block truncate font-mono text-[10px] text-[#17221d]/50">{phase.moves.length} {t("guide.moves")}{phase.case_id && phase.case_id !== "solved" ? ` · ${phase.case_id}` : ""}</span></span><Check className="h-4 w-4 text-[#1ba77a]" /></button>; }) : ["Cross", "F2L 1", "F2L 2", "F2L 3", "F2L 4", "OLL", "PLL"].map((label, index) => <div key={label} className="flex items-center gap-3 rounded-md border border-[#17221d]/10 bg-[#f4f0e8] p-3 text-[#17221d]/45"><span className="grid h-9 w-9 place-items-center rounded-sm bg-white font-mono text-xs">{String(index + 1).padStart(2, "0")}</span><span className="text-sm font-bold">{label}</span></div>)}</div></div>
            <div className="telemetry-panel rounded-[1rem] border-2 border-[#17221d] bg-[#e9e3d6] p-5"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#17221d]/55">{t("check.title")}</p><div className="mt-3 space-y-2 font-mono text-xs"><div className="flex justify-between border-b-2 border-[#17221d]/10 pb-2"><span>{t("check.oll")}</span><b>57 / 57</b></div><div className="flex justify-between border-b-2 border-[#17221d]/10 pb-2"><span>{t("check.pll")}</span><b>21 / 21</b></div><div className="flex justify-between"><span>{t("check.turns")}</span><b className="text-[#1b7b5e]">4 × 100%</b></div></div></div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div className="telemetry-panel rounded-md border-2 border-[#17221d] bg-white p-3 shadow-[3px_3px_0_rgba(23,34,29,0.12)]"><div className="flex items-center justify-between text-[#17221d]/45">{icon}<span className="font-mono text-[8px] font-bold tracking-[0.12em]">{label}</span></div><p className="mt-2 font-mono text-xl font-bold tracking-[-0.08em]">{value}</p></div>;
}
