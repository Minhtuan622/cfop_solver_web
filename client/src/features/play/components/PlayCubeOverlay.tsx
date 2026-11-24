import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { formatPlayTime } from "../lib/playHistory";
import type { PlayMode, RaceStatus } from "../lib/playTypes";

export function PlayCubeOverlay({
  mode,
  status,
  elapsedMs,
  inspectionLeft,
}: {
  mode: PlayMode;
  status: RaceStatus;
  elapsedMs: number;
  inspectionLeft: number;
}) {
  const { t } = useLanguage();
  return (
    <div
      className="pointer-events-none absolute inset-0 grid place-items-center"
      aria-live="polite"
    >
      {mode === "race" && status === "solving" ? (
        <p className="rounded-full bg-canvas/90 px-6 py-3 font-mono text-5xl font-bold tabular-nums text-ink sm:text-6xl">
          {formatPlayTime(elapsedMs)}
        </p>
      ) : null}
      {mode === "race" && status === "inspection" ? (
        <p
          className={cn(
            "rounded-full bg-canvas/90 px-6 py-3 font-mono text-6xl font-bold tabular-nums",
            inspectionLeft <= 3 ? "text-danger" : "text-ink"
          )}
        >
          {Math.ceil(inspectionLeft)}
        </p>
      ) : null}
      {mode === "race" && (status === "armed" || status === "idle") ? (
        <p className="max-w-xs rounded-full bg-canvas/90 px-6 py-3 text-center text-sm font-semibold text-ink">
          {status === "armed" ? t("play.readyHint") : t("play.startHint")}
        </p>
      ) : null}
    </div>
  );
}
