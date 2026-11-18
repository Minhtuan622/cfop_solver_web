/**
 * SmartCubeHero — the live display while a Bluetooth smart cube is paired.
 *
 * Shows the cube's current state (2D net), the move counter and TPS, and
 * the detection phase. The big timer display still comes from the app
 * (or the GAN Timer when it is connected), the cube drives *solve
 * boundaries*: it arms when the cube reaches the scramble, starts when the
 * first move lands, and stops when the cube is solved again.
 */
import { Bluetooth, CheckCircleFill } from "@/components/ui/Icon";
import { CubeNet } from "@/components/common/CubeNet";
import type { SmartCube } from "../useSmartCube";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";

export function SmartCubeHero({
  smartCube,
  onDisconnect,
  externalTimerLabel,
}: {
  smartCube: SmartCube;
  onDisconnect: () => void;
  /** Label of the timer providing the recorded time (e.g. "GAN Timer"). */
  externalTimerLabel?: string;
}) {
  const { language, t } = useLanguage();
  const { phase, movesCount, tps, state, batteryPercent, cubeName } = smartCube;

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
        {externalTimerLabel ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="normal-case tracking-normal text-ink">
              {externalTimerLabel}
            </span>
          </>
        ) : null}
      </div>

      <div className="flex items-center justify-center">
        <div className="w-full max-w-xs sm:max-w-sm">
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
