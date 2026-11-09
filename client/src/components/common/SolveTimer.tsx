/** Xưởng Cơ Khí Tốc Độ — timer runs a deliberate pre-solve inspection before solve timing. */
/* Xưởng Cơ Khí Tốc Độ — timer là apparatus thao tác: mint chỉ báo arm, Space thả mới khởi động. */
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  formatTimerReadout,
  SPLIT_PHASES,
  type SolvePhaseSplit,
  type SplitPhase,
} from "@/lib/solveHistory";
import { cn } from "@/lib/utils";

export type TimerCompletion = {
  elapsedMs: number;
  inspectionMs: number;
  automaticPenalty: "none" | "+2" | "DNF";
  phaseSplits: SolvePhaseSplit[];
};

export function SolveTimer({
  onComplete,
  soundEnabled = true,
  splitEnabled = false,
  splitPhases = SPLIT_PHASES,
  inspectionEnabled = true,
}: {
  onComplete?: (completion: TimerCompletion) => void;
  soundEnabled?: boolean;
  splitEnabled?: boolean;
  splitPhases?: readonly SplitPhase[];
  inspectionEnabled?: boolean;
}) {
  const { language } = useLanguage();
  const [mode, setMode] = useState<
    "ready" | "inspection" | "running" | "completed"
  >("ready");
  const [elapsed, setElapsed] = useState(0);
  const [inspectionRemaining, setInspectionRemaining] = useState(15_000);
  const [inspectionElapsed, setInspectionElapsed] = useState(0);
  const [splitIndex, setSplitIndex] = useState(0);
  const [armed, setArmed] = useState(false);
  const armedRef = useRef(false);
  const startedAt = useRef(0);
  const carried = useRef(0);
  const inspectionAt = useRef(0);
  const inspectionDuration = useRef(0);
  const inspectionCues = useRef(new Set<number>());
  const phaseSplits = useRef<SolvePhaseSplit[]>([]);
  const labels =
    language === "vi"
      ? {
          inspection: "INSPECTION",
          inspectHelp:
            "Quan sát scramble và lên kế hoạch Cross/F2L trước khi bấm giải.",
          startInspect: "Bắt đầu inspection",
          startSolve: "Bắt đầu solve",
          inspectionEnd: "Inspection đã hết — bấm để bắt đầu solve.",
          inspectionPlusTwo: "Inspection vượt 15 giây: lượt này sẽ +2.",
          inspectionDnf: "Inspection vượt 17 giây: lượt này sẽ DNF.",
          split: "SPLIT INPUT",
          next: "MỐC KẾ TIẾP",
          armed: "THẢ SPACE / ENTER / CHẠM",
          cancelInspection: "ESC · HỦY INSPECTION",
        }
      : {
          inspection: "INSPECTION",
          inspectHelp:
            "Inspect the scramble and plan Cross/F2L before starting your solve.",
          startInspect: "Start inspection",
          startSolve: "Start solve",
          inspectionEnd: "Inspection is complete — start your solve.",
          inspectionPlusTwo:
            "Inspection exceeded 15 seconds: this solve will receive +2.",
          inspectionDnf:
            "Inspection exceeded 17 seconds: this solve will be DNF.",
          split: "INPUT SPLIT",
          next: "NEXT MARK",
          armed: "RELEASE SPACE / ENTER / TOUCH",
          cancelInspection: "ESC · CANCEL INSPECTION",
        };
  const penaltyForInspection = (
    ms: number
  ): TimerCompletion["automaticPenalty"] =>
    ms > 17_000 ? "DNF" : ms > 15_000 ? "+2" : "none";
  const beep = (frequency: number) => {
    if (!soundEnabled) return;
    try {
      const Context =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Context) return;
      const context = new Context();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.11, context.currentTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + 0.13
      );
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.14);
      window.setTimeout(() => void context.close(), 220);
    } catch {
      /* Browser audio may be blocked; timing remains accurate. */
    }
  };
  const startInspection = () => {
    carried.current = 0;
    inspectionDuration.current = 0;
    inspectionCues.current.clear();
    phaseSplits.current = [];
    setSplitIndex(0);
    setElapsed(0);
    setInspectionElapsed(0);
    setInspectionRemaining(15_000);
    inspectionAt.current = performance.now();
    setMode("inspection");
  };
  const cancelInspection = () => {
    armedRef.current = false;
    carried.current = 0;
    inspectionDuration.current = 0;
    inspectionCues.current.clear();
    phaseSplits.current = [];
    setSplitIndex(0);
    setElapsed(0);
    setInspectionElapsed(0);
    setInspectionRemaining(15_000);
    setArmed(false);
    setMode("ready");
  };
  const startSolve = () => {
    inspectionDuration.current = Math.max(
      0,
      performance.now() - inspectionAt.current
    );
    startedAt.current = performance.now();
    setMode("running");
  };
  const startDirect = () => {
    carried.current = 0;
    inspectionDuration.current = 0;
    phaseSplits.current = [];
    setSplitIndex(0);
    setElapsed(0);
    startedAt.current = performance.now();
    setMode("running");
  };
  const stopSolve = (
    finalElapsed = carried.current + performance.now() - startedAt.current,
    splits = phaseSplits.current,
    forcedPenalty?: TimerCompletion["automaticPenalty"]
  ) => {
    carried.current = finalElapsed;
    setElapsed(finalElapsed);
    setMode("completed");
    if (finalElapsed > 0 || forcedPenalty === "DNF")
      onComplete?.({
        elapsedMs: finalElapsed,
        inspectionMs: inspectionDuration.current,
        automaticPenalty:
          forcedPenalty ?? penaltyForInspection(inspectionDuration.current),
        phaseSplits: splits,
      });
  };
  const markSplit = () => {
    const finalElapsed =
      carried.current + performance.now() - startedAt.current;
    const phase = splitPhases[splitIndex];
    if (!phase) return stopSolve(finalElapsed);
    const previousMark = phaseSplits.current.at(-1)?.markedAtMs ?? 0;
    const nextSplits = [
      ...phaseSplits.current,
      {
        phase,
        markedAtMs: finalElapsed,
        elapsedMs: finalElapsed - previousMark,
      },
    ];
    phaseSplits.current = nextSplits;
    if (phase === "PLL") stopSolve(finalElapsed, nextSplits);
    else setSplitIndex(index => index + 1);
  };
  const beginFromReady = () => {
    if (mode === "ready" || mode === "completed") {
      if (inspectionEnabled) startInspection();
      else startDirect();
    } else if (mode === "inspection") startSolve();
  };
  const toggle = () => {
    if (mode === "ready" || mode === "completed" || mode === "inspection")
      beginFromReady();
    else if (splitEnabled) markSplit();
    else stopSolve();
  };
  const armStart = () => {
    if (mode === "ready" || mode === "completed" || mode === "inspection") {
      armedRef.current = true;
      setArmed(true);
    }
  };
  const releaseStart = () => {
    if (!armedRef.current) return;
    armedRef.current = false;
    setArmed(false);
    beginFromReady();
  };
  useEffect(() => {
    if (mode !== "running") return;
    const id = window.setInterval(
      () => setElapsed(carried.current + performance.now() - startedAt.current),
      20
    );
    return () => window.clearInterval(id);
  }, [mode]);
  useEffect(() => {
    if (mode !== "inspection") return;
    const id = window.setInterval(() => {
      const next = Math.max(0, performance.now() - inspectionAt.current);
      setInspectionElapsed(next);
      setInspectionRemaining(Math.max(0, 15_000 - next));
    }, 30);
    return () => window.clearInterval(id);
  }, [mode]);
  useEffect(() => {
    if (mode !== "inspection") return;
    (
      [
        [8_000, 660],
        [12_000, 880],
      ] as const
    ).forEach(([threshold, frequency]) => {
      if (
        inspectionElapsed >= threshold &&
        !inspectionCues.current.has(threshold)
      ) {
        inspectionCues.current.add(threshold);
        beep(frequency);
      }
    });
  }, [inspectionElapsed, mode]);
  const isInteractiveTarget = (target: EventTarget | null) => {
    const element = target as HTMLElement | null;
    const tag = element?.tagName;
    return (
      element?.isContentEditable ||
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      tag === "BUTTON" ||
      tag === "A"
    );
  };
  const touchStart = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "touch" || isInteractiveTarget(event.target))
      return;
    event.preventDefault();
    if (mode === "running") {
      if (splitEnabled) markSplit();
      else stopSolve();
    } else armStart();
  };
  const touchEnd = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "touch" || isInteractiveTarget(event.target))
      return;
    event.preventDefault();
    releaseStart();
  };
  useEffect(() => {
    const timerKey = (event: KeyboardEvent) =>
      event.code === "Space" || event.code === "Enter";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Escape" && !isInteractiveTarget(event.target)) {
        if (mode === "inspection") {
          event.preventDefault();
          cancelInspection();
          return;
        }
        if (mode === "running") {
          event.preventDefault();
          stopSolve(
            carried.current + performance.now() - startedAt.current,
            phaseSplits.current,
            "DNF"
          );
          return;
        }
      }
      if (!timerKey(event) || isInteractiveTarget(event.target)) return;
      event.preventDefault();
      if (event.repeat) return;
      if (mode === "running") {
        if (splitEnabled) markSplit();
        else stopSolve();
      } else armStart();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (!timerKey(event) || isInteractiveTarget(event.target)) return;
      event.preventDefault();
      releaseStart();
    };
    const onWindowBlur = () => {
      armedRef.current = false;
      setArmed(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onWindowBlur);
    };
  });
  const isInspection = mode === "inspection";
  const readout = isInspection
    ? formatTimerReadout(inspectionRemaining)
    : formatTimerReadout(elapsed);
  const inspectionPenalty = penaltyForInspection(inspectionElapsed);
  const helper = isInspection
    ? inspectionPenalty === "DNF"
      ? labels.inspectionDnf
      : inspectionPenalty === "+2"
        ? labels.inspectionPlusTwo
        : ""
    : "";
  return (
    <section
      onPointerDown={touchStart}
      onPointerUp={touchEnd}
      onPointerCancel={() => {
        armedRef.current = false;
        setArmed(false);
      }}
      className={cn(
        "relative rounded-card border-2 px-4 py-10 text-center transition-colors duration-150",
        isInspection
          ? "border-warning/60 bg-warning-soft/40"
          : armed
            ? "border-primary bg-primary-soft/60"
            : "border-transparent bg-surface-2"
      )}
      aria-live="polite"
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <p
          className={cn(
            "mb-0 font-mono text-[clamp(3.2rem,10vw,5.5rem)] font-bold leading-none tracking-tight tabular-nums",
            isInspection ? "text-warning" : "text-ink"
          )}
        >
          {readout}
        </p>
        {!inspectionEnabled && (
          <button
            type="button"
            onClick={toggle}
            className={
              mode === "running"
                ? "inline-flex items-center justify-center gap-2 rounded-full border border-danger/40 bg-transparent px-12 py-3 text-base font-semibold text-danger transition hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                : "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-12 py-3 text-base font-semibold text-white shadow-sm shadow-primary/25 transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            }
          >
            {mode === "running"
              ? language === "vi"
                ? "Dừng"
                : "Stop"
              : language === "vi"
                ? "Bắt đầu"
                : "Start"}
          </button>
        )}
      </div>
      {armed && (
        <div className="mt-4 text-sm font-semibold text-primary">
          {labels.armed}
        </div>
      )}
      {isInspection && (
        <p className="mt-4 mb-0 text-sm text-muted">
          {labels.cancelInspection}
        </p>
      )}
      {splitEnabled && mode === "running" && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 border-t border-line pt-4 text-sm">
          <span className="font-semibold text-primary">{labels.split}</span>
          <span className="text-muted">{labels.next}</span>
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-3 text-ink">
            {splitPhases[splitIndex] ?? splitPhases.at(-1) ?? "—"}
          </span>
          <span className="text-muted">
            {phaseSplits.current.map(split => split.phase).join(" · ") || "—"}
          </span>
        </div>
      )}
      {helper && (
        <div className="rounded-panel border px-4 py-3 text-sm border-warning/25 bg-warning-soft text-ink py-2 mt-4 mb-0 text-left">
          {helper}
        </div>
      )}
    </section>
  );
}
