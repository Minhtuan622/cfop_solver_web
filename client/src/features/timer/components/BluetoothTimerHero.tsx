import { useEffect, useRef, useState } from "react";
import { Bluetooth, CheckCircleFill, TimerReset } from "@/components/ui/Icon";
import { formatTimerReadout } from "@/lib/solveHistory";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import type { GanTimerHandle } from "../lib/bluetoothTimer";

type Mode = "idle" | "running" | "completed";

type TimerEventDetail = { detail?: { currentTime?: number } };

export function BluetoothTimerHero({
  timer,
  deviceName,
  onDisconnect,
  onSolveComplete,
}: {
  timer: GanTimerHandle;
  deviceName: string;
  onDisconnect: () => void;
  onSolveComplete: (finalMs: number) => void;
}) {
  const { language, t } = useLanguage();
  const [mode, setMode] = useState<Mode>("idle");
  const [elapsed, setElapsed] = useState(0);
  const solveCountRef = useRef(0);
  const completeRef = useRef(onSolveComplete);
  completeRef.current = onSolveComplete;

  useEffect(() => {
    const onStart = () => {
      setElapsed(0);
      setMode("running");
    };
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ currentTime: number }> &
        TimerEventDetail).detail;
      const currentTime = detail?.currentTime;
      if (typeof currentTime === "number" && Number.isFinite(currentTime)) {
        setElapsed(currentTime);
      }
    };
    const onStop = (event: Event) => {
      const detail = (event as CustomEvent<{ currentTime: number }> &
        TimerEventDetail).detail;
      const currentTime = detail?.currentTime;
      if (typeof currentTime !== "number" || !Number.isFinite(currentTime))
        return;
      setElapsed(currentTime);
      setMode("completed");
      solveCountRef.current += 1;
      completeRef.current(currentTime);
    };
    const onReset = () => {
      setElapsed(0);
      setMode("idle");
    };
    timer.addEventListener("start", onStart as EventListener);
    timer.addEventListener("update", onUpdate as EventListener);
    timer.addEventListener("stop", onStop as EventListener);
    timer.addEventListener("reset", onReset as EventListener);
    return () => {
      timer.removeEventListener("start", onStart as EventListener);
      timer.removeEventListener("update", onUpdate as EventListener);
      timer.removeEventListener("stop", onStop as EventListener);
      timer.removeEventListener("reset", onReset as EventListener);
    };
  }, [timer]);

  const helper =
    mode === "running"
      ? t("timer.ble.heroRunning")
      : mode === "completed"
        ? t("timer.ble.heroSaved")
        : t("timer.ble.heroReady");

  return (
    <section
      aria-live="polite"
      role="status"
      className="relative rounded-card px-4 py-10 text-center transition-colors duration-150 @container bg-surface-2"
    >
      <div className="mb-4 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        <Bluetooth className="text-base text-muted" aria-hidden="true" />
        <span>{t("timer.ble.heroLabel")}</span>
        <span aria-hidden="true">·</span>
        <span className="normal-case tracking-normal text-ink">{deviceName}</span>
      </div>
      <div className="flex flex-col items-center justify-center gap-4">
        <p
          className={`mb-0 max-w-full font-mono text-[clamp(1.25rem,11cqw,5.5rem)] font-bold leading-none tracking-tight tabular-nums ${
            mode === "completed" ? "text-success" : "text-ink"
          }`}
        >
          {formatTimerReadout(elapsed)}
        </p>
        {mode === "completed" ? (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
            <CheckCircleFill className="text-sm" aria-hidden="true" />
            {language === "vi" ? "Đã lưu" : "Saved"}
          </p>
        ) : null}
      </div>
      <p className="mt-4 mb-0 text-sm text-muted">{helper}</p>
      <div className="mt-5 flex items-center justify-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onDisconnect}>
          <TimerReset className="mr-1 text-base" aria-hidden="true" />
          {t("timer.ble.disconnect")}
        </Button>
      </div>
    </section>
  );
}
