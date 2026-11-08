import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from "@/components/ui/BootstrapIcon";
import { IconButton } from "@/components/ui/BootstrapUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type SolverSolutionPanelProps = {
  view: "2d" | "3d";
  onViewChange: (view: "2d" | "3d") => void;
  /** The name of the current stage, or the headline of the memo. */
  title: ReactNode;
  /** One line of context under the title. */
  subtitle: ReactNode;
  /** A quiet line above the title, such as the step counter. */
  eyebrow?: ReactNode;
  /** The move that is being shown, spelled out in big letters. */
  move: string | null;
  moveLabel: string;
  turnCount: number;
  hasResult: boolean;
  cursor: number;
  playing: boolean;
  playbackSpeed: number;
  onTogglePlay: () => void;
  onStep: (delta: number) => void;
  onReset: () => void;
  onSeek: (cursor: number) => void;
  onPlaybackSpeedChange: (speed: number) => void;
  /** The cube itself. */
  children: ReactNode;
};

/**
 * The right half of the workspace: the cube, and — only once there is a
 * solution — the controls that walk through it.
 */
export function SolverSolutionPanel({
  view,
  onViewChange,
  title,
  subtitle,
  eyebrow,
  move,
  moveLabel,
  turnCount,
  hasResult,
  cursor,
  playing,
  playbackSpeed,
  onTogglePlay,
  onStep,
  onReset,
  onSeek,
  onPlaybackSpeedChange,
  children,
}: SolverSolutionPanelProps) {
  const { t } = useLanguage();

  return (
    <section className="card border-0 shadow-sm rounded-4 overflow-hidden">
      <header className="card-header bg-body border-0 d-flex align-items-start justify-content-between gap-3 px-4 pt-4">
        <div>
          {eyebrow ? <p className="small text-primary mb-1">{eyebrow}</p> : null}
          <h2 className="h5 mb-1">{title}</h2>
          <p className="small text-body-secondary mb-0">{subtitle}</p>
        </div>
        {hasResult ? (
          <div className="text-end">
            <span className="small text-body-secondary d-block">{moveLabel}</span>
            <strong className="fs-3">{move ?? "—"}</strong>
          </div>
        ) : null}
      </header>

      <div className="card-body px-4 pb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <div className="btn-group btn-group-sm rounded-pill" role="group" aria-label={t("home.viewLabel")}>
            <button type="button" aria-pressed={view === "2d"} onClick={() => onViewChange("2d")} className={cn("btn", view === "2d" ? "btn-primary" : "btn-outline-secondary")}>2D</button>
            <button type="button" aria-pressed={view === "3d"} onClick={() => onViewChange("3d")} className={cn("btn", view === "3d" ? "btn-primary" : "btn-outline-secondary")}>3D</button>
          </div>
          <span className="small text-body-secondary">{hasResult ? t("home.turns", { count: turnCount }) : t("home.noSolutionYet")}</span>
        </div>

        <div className="bg-body-tertiary rounded-4 p-2">{children}</div>

        {hasResult ? (
          <div className="border-top mt-4 pt-4">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <IconButton label={t("guide.previous")} icon={<ArrowLeft className="fs-6" />} onClick={() => onStep(-1)} disabled={cursor === 0} className="btn btn-outline-secondary" />
              <IconButton label={playing ? t("guide.pause") : t("guide.play")} icon={playing ? <Pause className="fs-6" /> : <Play className="fs-6" />} onClick={onTogglePlay} disabled={cursor === turnCount} className="btn btn-primary" />
              <IconButton label={t("guide.next")} icon={<ArrowRight className="fs-6" />} onClick={() => onStep(1)} disabled={cursor === turnCount} className="btn btn-outline-secondary" />
              <IconButton label={t("guide.reset")} icon={<RotateCcw className="fs-6" />} onClick={onReset} className="btn btn-outline-secondary ms-auto" />
            </div>
            <div className="row g-3 align-items-center mt-1">
              <div className="col">
                <input
                  aria-label={t("home.chooseTurn")}
                  type="range"
                  min="0"
                  max={Math.max(0, turnCount)}
                  value={cursor}
                  onChange={(event) => onSeek(Number(event.target.value))}
                  className="form-range"
                />
                <small className="text-body-secondary">{t("home.turns", { count: cursor })}</small>
              </div>
              <div className="col-12 col-sm-auto">
                <label className="form-label mb-0">{t("home.speed")} {playbackSpeed.toFixed(2)}×
                  <input
                    aria-label={t("home.playbackSpeed")}
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.25"
                    value={playbackSpeed}
                    onChange={(event) => onPlaybackSpeedChange(Number(event.target.value))}
                    className="form-range"
                  />
                </label>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-body-secondary small mt-3 mb-0">{t("home.solvePrompt")}</p>
        )}
      </div>
    </section>
  );
}
