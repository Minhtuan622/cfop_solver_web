/**
 * SmartCubeHero — the live display while a Bluetooth smart cube is paired.
 *
 * Shows the cube's current state (2D net), the live solve time, the move
 * counter and TPS, and the detection phase. The cube drives *solve
 * boundaries* (arm → first move → solved → stop); the time readout comes
 * from the GAN Timer when one is connected, otherwise from a local clock.
 */
import { useEffect, useRef, useState } from "react";
import { Bluetooth, CheckCircleFill } from "@/components/ui/Icon";
import { CubeNet } from "@/components/common/CubeNet";
import { formatTimerReadout } from "@/lib/solveHistory";
import type { SmartCube } from "../useSmartCube";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import type { GanTimerHandle } from "../lib/bluetoothTimer";

type TimerDetail = { currentTime?: number };

export function SmartCubeHero({
  smartCube,
  onDisconnect,
  externalTimer,
}: {
  smartCube: SmartCube;
  onDisconnect: () => void;
  /** The connected GAN Timer, if any: its live time is the readout. */
  externalTimer?: { deviceName: string; timer: GanTimerHandle };
}) {
  const { language, t } = useLanguage();
  const { phase, movesCount, tps, state, batteryPercent, cubeName } = smartCube;

  // Readout source: the GAN Timer's own event stream when connected…
  const [timerMs, setTimerMs] = useState<number | null>(null);
  useEffect(() => {
    const timer = externalTimer?.timer;
    if (!timer) return;
    const onStart = () => setTimerMs(0);
    const onUpdate = (event: Event) => {
      const ms = (event as CustomEvent<TimerDetail>).detail?.currentTime;
      if (typeof ms === "number" && Number.isFinite(ms)) setTimerMs(ms);
    };
    const onStop = (event: Event) => {
      const ms = (event as CustomEvent<TimerDetail>).detail?.currentTime;
      if (typeof ms === "number" && Number.isFinite(ms)) setTimerMs(ms);
    };
    const onReset = () => setTimerMs(0);
    timer.addEventListener("start", onStart);
    timer.addEventListener("update", onUpdate);
    timer.addEventListener("stop", onStop);
    timer.addEventListener("reset", onReset);
    return () => {
      timer.removeEventListener("start", onStart);
      timer.removeEventListener("update", onUpdate);
      timer.removeEventListener("stop", onStop);
      timer.removeEventListener("reset", onReset);
    };
  }, [externalTimer?.timer]);

  // …otherwise a local clock anchored on phase transitions.
  const [localMs, setLocalMs] = useState(0);
  const anchorRef = useRef<number | null>(null);
  useEffect(() => {
    if (phase === "solving") {
      if (anchorRef.current === null) anchorRef.current = performance.now();
      const id = window.setInterval(
        () => setLocalMs(performance.now() - (anchorRef.current ?? 0)),
        50,
      );
      return () => window.clearInterval(id);
    }
    if (phase === "idle" || phase === "ready") {
      anchorRef.current = null;
      setLocalMs(0);
    }
    return undefined;
  }, [phase]);

  const readout = timerMs ?? localMs;

  const helper =
    phase === "ready"
      ? t("timer.smartCube.ready")
      : phase === "solving"
        ? t("timer.smartCube.solving")
        : phase === "completed"
          ? t("timer.smartCube.saved")
          : t("timer.smartCube.armed");

  const movesLine =
    phase === "idle" || phase === "ready"
      ? ""
      : `${movesCount} ${t("timer.smartCube.moves")}${
          tps !== null ? ` · ${tps.toFixed(2)} TPS` : ""
        }`;

  return (
    <section
      aria-live="polite"
      role="status"
      className="relative rounded-card px-4 py-10 text-center transition-colors duration-150 @container bg-surface-2"
    >
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        <Bluetooth className="text-base text-primary" aria-hidden="true" />
        <span>{t("timer.smartCube.heroLabel")}</span>
        {cubeName ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="normal-case tracking-normal text-ink">{cubeName}</span>
          </>
        ) : null}
        {batteryPercent !== null ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="normal-case tracking-normal text-ink">
              {batteryPercent}%
            </span>
          </>
        ) : null}
        {externalTimer ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="normal-case tracking-normal text-ink">
              GAN TIMER · {externalTimer.deviceName}
            </span>
          </>
        ) : null}
      </div>

      <p
        className={`mb-0 max-w-full font-mono text-[clamp(1.25rem,11cqw,5.5rem)] font-bold leading-none tracking-tight tabular-nums ${
          phase === "completed" ? "text-success" : "text-ink"
        }`}
      >
        {formatTimerReadout(readout)}
      </p>

      <div className="mt-6 flex items-center justify-center">
        <div className="w-full max-w-[11rem] sm:max-w-[13rem]">
          {state ? (
            <CubeNet state={state} />
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-muted">
              {t("timer.smartCube.reading")}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        {phase === "completed" ? (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
            <CheckCircleFill className="text-sm" aria-hidden="true" />
            {language === "vi" ? "Đã lưu" : "Saved"}
          </p>
        ) : null}
        {movesLine ? (
          <p className="mb-0 font-mono text-sm text-muted tabular-nums">{movesLine}</p>
        ) : null}
      </div>

      <p className="mt-3 mb-0 text-sm text-muted">{helper}</p>
      {phase === "idle" || phase === "ready" ? (
        <p className="mt-1 mb-0 text-xs text-warning">{t("timer.smartCube.orientationNote")}</p>
      ) : null}
      <div className="mt-5 flex items-center justify-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onDisconnect}>
          {t("timer.ble.disconnect")}
        </Button>
      </div>
    </section>
  );
}
