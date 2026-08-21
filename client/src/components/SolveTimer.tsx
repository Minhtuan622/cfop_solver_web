/** Xưởng Cơ Khí Tốc Độ — timer runs a deliberate pre-solve inspection before solve timing. */
import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Square, Timer } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

function format(ms: number) { const total = Math.max(0, ms) / 1000; return `${Math.floor(total / 60).toString().padStart(2, "0")}:${Math.floor(total % 60).toString().padStart(2, "0")}.${Math.floor((total % 1) * 100).toString().padStart(2, "0")}`; }

export type TimerCompletion = { elapsedMs: number; inspectionMs: number; automaticPenalty: "none" | "+2" | "DNF" };

export function SolveTimer({ onComplete }: { onComplete?: (completion: TimerCompletion) => void }) {
  const { t, language } = useLanguage();
  const [mode, setMode] = useState<"ready" | "inspection" | "running" | "completed">("ready");
  const [elapsed, setElapsed] = useState(0);
  const [inspectionRemaining, setInspectionRemaining] = useState(15_000);
  const [inspectionElapsed, setInspectionElapsed] = useState(0);
  const startedAt = useRef(0);
  const carried = useRef(0);
  const inspectionAt = useRef(0);
  const inspectionDuration = useRef(0);
  const labels = language === "vi" ? { inspection: "INSPECTION", inspectHelp: "Quan sát scramble và lên kế hoạch Cross/F2L trước khi bấm giải.", startInspect: "Bắt đầu inspection", startSolve: "Bắt đầu solve", inspectionEnd: "Inspection đã hết — bấm để bắt đầu solve.", inspectionPlusTwo: "Inspection vượt 15 giây: lượt này sẽ +2.", inspectionDnf: "Inspection vượt 17 giây: lượt này sẽ DNF." } : { inspection: "INSPECTION", inspectHelp: "Inspect the scramble and plan Cross/F2L before starting your solve.", startInspect: "Start inspection", startSolve: "Start solve", inspectionEnd: "Inspection is complete — start your solve.", inspectionPlusTwo: "Inspection exceeded 15 seconds: this solve will receive +2.", inspectionDnf: "Inspection exceeded 17 seconds: this solve will be DNF." };
  const penaltyForInspection = (ms: number): TimerCompletion["automaticPenalty"] => ms > 17_000 ? "DNF" : ms > 15_000 ? "+2" : "none";
  const startInspection = () => { carried.current = 0; inspectionDuration.current = 0; setElapsed(0); setInspectionElapsed(0); setInspectionRemaining(15_000); inspectionAt.current = performance.now(); setMode("inspection"); };
  const startSolve = () => { inspectionDuration.current = Math.max(0, performance.now() - inspectionAt.current); startedAt.current = performance.now(); setMode("running"); };
  const stopSolve = () => { const finalElapsed = carried.current + performance.now() - startedAt.current; carried.current = finalElapsed; setElapsed(finalElapsed); setMode("completed"); if (finalElapsed > 0) onComplete?.({ elapsedMs: finalElapsed, inspectionMs: inspectionDuration.current, automaticPenalty: penaltyForInspection(inspectionDuration.current) }); };
  const toggle = () => { if (mode === "ready" || mode === "completed") startInspection(); else if (mode === "inspection") startSolve(); else stopSolve(); };
  const reset = () => { carried.current = 0; inspectionDuration.current = 0; setElapsed(0); setInspectionElapsed(0); setInspectionRemaining(15_000); setMode("ready"); };
  useEffect(() => { if (mode !== "running") return; const id = window.setInterval(() => setElapsed(carried.current + performance.now() - startedAt.current), 20); return () => window.clearInterval(id); }, [mode]);
  useEffect(() => { if (mode !== "inspection") return; const id = window.setInterval(() => { const next = Math.max(0, performance.now() - inspectionAt.current); setInspectionElapsed(next); setInspectionRemaining(Math.max(0, 15_000 - next)); }, 30); return () => window.clearInterval(id); }, [mode]);
  useEffect(() => { const handler = (event: KeyboardEvent) => { const tag = (event.target as HTMLElement)?.tagName; if (event.code === "Space" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") { event.preventDefault(); toggle(); } }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); });
  const isInspection = mode === "inspection";
  const readout = isInspection ? format(inspectionRemaining) : format(elapsed);
  const title = isInspection ? labels.inspection : t("timer.title");
  const inspectionPenalty = penaltyForInspection(inspectionElapsed);
  const helper = isInspection ? (inspectionPenalty === "DNF" ? labels.inspectionDnf : inspectionPenalty === "+2" ? labels.inspectionPlusTwo : inspectionRemaining > 0 ? labels.inspectHelp : labels.inspectionEnd) : t("timer.help");
  const action = mode === "running" ? t("timer.stop") : isInspection ? labels.startSolve : mode === "ready" || mode === "completed" ? labels.startInspect : t("timer.start");
  return <section className={`timer-card rounded-sm border-2 border-[#17221d] bg-[#e9e3d6] p-5 ${isInspection ? "timer-inspection" : ""}`}><div className="flex items-center justify-between"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#17221d]/55">{title}</p>{isInspection && <Timer className="h-4 w-4 text-[#1ba77a]" />}</div><p className="mt-1 text-xs text-[#17221d]/60">{helper}</p><p className="mt-4 font-mono text-5xl font-black leading-none tracking-[-0.1em]">{readout}</p><div className="mt-5 flex gap-2"><button onClick={toggle} className="scanner-button flex-1">{mode === "running" ? <><Square className="h-3.5 w-3.5 fill-current" />{action}</> : <><Play className="h-3.5 w-3.5 fill-current" />{action}</>}</button><button onClick={reset} className="scanner-button scanner-secondary"><RotateCcw className="h-3.5 w-3.5" />{t("timer.reset")}</button></div></section>;
}
