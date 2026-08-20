/** A beginner-friendly stopwatch for a full Rubik's Cube solve. */
import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Square } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

function format(ms: number) { const total = ms / 1000; return `${Math.floor(total / 60).toString().padStart(2, "0")}:${Math.floor(total % 60).toString().padStart(2, "0")}.${Math.floor((total % 1) * 100).toString().padStart(2, "0")}`; }

export function SolveTimer({ onComplete, canSave }: { onComplete?: (elapsedMs: number) => void; canSave?: boolean }) {
  const { t } = useLanguage();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);
  const carried = useRef(0);
  const toggle = () => { if (running) { const finalElapsed = carried.current + performance.now() - startedAt.current; carried.current = finalElapsed; setElapsed(finalElapsed); setRunning(false); if (canSave && finalElapsed > 200) onComplete?.(finalElapsed); } else { startedAt.current = performance.now(); setRunning(true); } };
  const reset = () => { carried.current = 0; setElapsed(0); setRunning(false); };
  useEffect(() => { if (!running) return; const id = window.setInterval(() => setElapsed(carried.current + performance.now() - startedAt.current), 20); return () => window.clearInterval(id); }, [running]);
  useEffect(() => { const handler = (event: KeyboardEvent) => { const tag = (event.target as HTMLElement)?.tagName; if (event.code === "Space" && tag !== "INPUT" && tag !== "TEXTAREA") { event.preventDefault(); toggle(); } }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); });
  return <section className="timer-card rounded-xl border-2 border-[#17221d] bg-[#e9e3d6] p-4"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#17221d]/55">{t("timer.title")}</p><p className="mt-1 text-xs text-[#17221d]/60">{t("timer.help")}</p><p className="mt-3 font-mono text-3xl font-bold tracking-[-0.08em]">{format(elapsed)}</p><div className="mt-3 flex gap-2"><button onClick={toggle} className="scanner-button flex-1">{running ? <><Square className="h-3.5 w-3.5 fill-current" />{t("timer.stop")}</> : <><Play className="h-3.5 w-3.5 fill-current" />{t("timer.start")}</>}</button><button onClick={reset} className="scanner-button scanner-secondary"><RotateCcw className="h-3.5 w-3.5" />{t("timer.reset")}</button></div>{canSave && <p className="mt-2 font-mono text-[9px] text-[#17221d]/50">{t("timer.saveHint")}</p>}</section>;
}
