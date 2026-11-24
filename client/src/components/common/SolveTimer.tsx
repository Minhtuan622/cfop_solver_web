import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatTimerReadout, type SolvePhaseSplit } from "@/lib/solveHistory";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export type TimerCompletion = {
  elapsedMs: number;
  inspectionMs: number;
  automaticPenalty: "none" | "+2" | "DNF";
  phaseSplits: SolvePhaseSplit[];
};

export function SolveTimer({
  onComplete,
  soundEnabled = true,
  voiceEnabled = true,
  metronomeEnabled = false,
  metronomeBpm = 60,
  inspectionEnabled = true,
  hideRunningTime = false,
  onModeChange,
}: {
  onComplete?: (completion: TimerCompletion) => void;
  soundEnabled?: boolean;
  voiceEnabled?: boolean;
  metronomeEnabled?: boolean;
  metronomeBpm?: number;
  inspectionEnabled?: boolean;
  hideRunningTime?: boolean;
  onModeChange?: (
    mode: "ready" | "inspection" | "running" | "completed"
  ) => void;
}) {
  const { language } = useLanguage();
  const [mode, setMode] = useState<
    "ready" | "inspection" | "running" | "completed"
  >("ready");
  const [elapsed, setElapsed] = useState(0);
  const onModeChangeRef = useRef(onModeChange);
  onModeChangeRef.current = onModeChange;
  useEffect(() => {
    onModeChangeRef.current?.(mode);
  }, [mode]);
  const [inspectionRemaining, setInspectionRemaining] = useState(15_000);
  const [inspectionElapsed, setInspectionElapsed] = useState(0);
  const [armed, setArmed] = useState(false);
  const armedRef = useRef(false);
  const startedAt = useRef(0);
  const carried = useRef(0);
  const inspectionAt = useRef(0);
  const inspectionDuration = useRef(0);
  const inspectionCues = useRef(new Set<number>());
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
          solving: "Đang giải…",
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
          solving: "Solving…",
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
    }
  };
  const speak = (text: string) => {
    if (!soundEnabled || !voiceEnabled) return;
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "vi" ? "vi-VN" : "en-US";
      utterance.rate = 1.05;
      utterance.volume = 0.9;
      synth.speak(utterance);
    } catch {
    }
  };
  const startInspection = () => {
    carried.current = 0;
    inspectionDuration.current = 0;
    inspectionCues.current.clear();
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
    setElapsed(0);
    startedAt.current = performance.now();
    setMode("running");
  };
  const stopSolve = (
    finalElapsed = carried.current + performance.now() - startedAt.current,
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
        phaseSplits: [] as SolvePhaseSplit[],
      });
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
    if (mode !== "running" || !metronomeEnabled) return;
    const bpm = Math.max(30, Math.min(240, Math.round(metronomeBpm) || 60));
    const id = window.setInterval(() => beep(980), 60_000 / bpm);
    return () => window.clearInterval(id);
  }, [mode, metronomeEnabled, metronomeBpm, soundEnabled]);
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
    const cues: ReadonlyArray<readonly [number, number, string]> =
      language === "vi"
        ? [
            [8_000, 660, "Tám giây"],
            [12_000, 880, "Mười hai giây"],
          ]
        : [
            [8_000, 660, "Eight seconds"],
            [12_000, 880, "Twelve seconds"],
          ];
    for (const [threshold, frequency, words] of cues) {
      if (
        inspectionElapsed >= threshold &&
        !inspectionCues.current.has(threshold)
      ) {
        inspectionCues.current.add(threshold);
        beep(frequency);
        speak(words);
      }
    }
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
    if (mode === "running") stopSolve();
    else armStart();
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
            "DNF"
          );
          return;
        }
      }
      if (!timerKey(event) || isInteractiveTarget(event.target)) return;
      event.preventDefault();
      if (event.repeat) return;
      if (mode === "running") stopSolve();
      else armStart();
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
  const isRunning = mode === "running";
  const readout = isInspection
    ? formatTimerReadout(inspectionRemaining)
    : isRunning && hideRunningTime
      ? labels.solving
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
        "rounded-card px-4 py-10 text-center transition-colors duration-150 @container",
        isRunning
          ? "fixed inset-0 z-50 flex flex-col items-center justify-center rounded-none bg-surface"
          : cn(
              "relative",
              isInspection
                ? "bg-warning-soft/40"
                : armed
                  ? "bg-primary-soft/60"
                  : "bg-surface-2"
            )
      )}
      aria-live="polite"
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <p
          className={cn(
            "mb-0 max-w-full font-mono font-bold leading-none tracking-tight tabular-nums",
            isRunning
              ? "text-[clamp(2.5rem,14cqw,10rem)]"
              : "text-[clamp(1.25rem,11cqw,5.5rem)]",
            isInspection ? "text-warning" : "text-ink"
          )}
        >
          {readout}
        </p>
        {!inspectionEnabled && (
          <Button
            type="button"
            variant={mode === "running" ? "danger" : "primary"}
            size="plain"
            className="px-12 py-3 text-base"
            onClick={toggle}
          >
            {mode === "running"
              ? language === "vi"
                ? "Dừng"
                : "Stop"
              : language === "vi"
                ? "Bắt đầu"
                : "Start"}
          </Button>
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
      {helper && (
        <div className="rounded-panel px-4 py-3 text-sm bg-warning-soft text-ink py-2 mt-4 mb-0 text-left">
          {helper}
        </div>
      )}
    </section>
  );
}
