import { BoxIcon, Grid, Pause, Play, RotateCcw, SkipEnd, SkipStart } from "@/components/ui/BootstrapIcon";
import { PillBar, PillGroup, RoundButton, Surface } from "@/components/ui/DesignSystem";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ReactNode } from "react";

export type SolverSolutionPanelProps = {
  view: "2d" | "3d";
  onViewChange: (view: "2d" | "3d") => void;
  /** The name of the current stage, or the headline of the memo. */
  title: ReactNode;
  /** One line of context under the title (kept for assistive text). */
  subtitle: ReactNode;
  /** A quiet line above the title, such as the step counter. */
  eyebrow?: ReactNode;
  /** The move that is being shown. */
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
  /** Status banner under the controls (e.g. "first steps are ready"). */
  footer?: ReactNode;
  /** The cube itself. */
  children: ReactNode;
};

/**
 * The cube stage: a 3D/2D switch, the cube, a pill-shaped player and an
 * optional status banner. The player appears only once there is a solution.
 */
export function SolverSolutionPanel({
  view, onViewChange, title, subtitle, eyebrow, move, moveLabel, turnCount, hasResult, cursor,
  playing, playbackSpeed, onTogglePlay, onStep, onReset, onPlaybackSpeedChange, footer, children,
}: SolverSolutionPanelProps) {
  const { t } = useLanguage();
  const speedLabel = t("home.speedValue", { speed: playbackSpeed.toFixed(1) });

  return (
    <Surface className="p-3 p-lg-4">
      <div className="ds-stage">
        {hasResult ? (
          <div className="ds-stage-chip" title={typeof subtitle === "string" ? subtitle : undefined}>
            {eyebrow ? <span className="text-body-secondary me-2">{eyebrow}</span> : null}
            <strong>{title}</strong>
            {move ? <span className="text-body-secondary ms-2">{moveLabel}: <strong className="text-body">{move}</strong></span> : null}
          </div>
        ) : null}
        <PillBar variant="soft" className="ds-stage-views">
          <PillGroup<"2d" | "3d">
            size="sm"
            label={t("home.viewLabel")}
            value={view}
            onChange={onViewChange}
            options={[
              { value: "3d", label: t("home.view3d"), icon: <BoxIcon aria-hidden="true" /> },
              { value: "2d", label: t("home.view2d"), icon: <Grid aria-hidden="true" /> },
            ]}
          />
        </PillBar>
        <div className="pt-4">{children}</div>
      </div>

      {hasResult ? (
        <div className="ds-player mt-3">
          <RoundButton label={t("guide.previous")} icon={<SkipStart />} onClick={() => onStep(-1)} disabled={cursor === 0} />
          <RoundButton tone="primary" size="lg" label={playing ? t("guide.pause") : t("guide.play")} icon={playing ? <Pause /> : <Play />} onClick={onTogglePlay} disabled={cursor === turnCount} />
          <RoundButton label={t("guide.next")} icon={<SkipEnd />} onClick={() => onStep(1)} disabled={cursor === turnCount} />
          <RoundButton label={t("guide.reset")} icon={<RotateCcw />} onClick={onReset} />
          <span className="ds-divider d-none d-sm-block" aria-hidden="true" />
          <div className="ds-speed">
            <label className="d-block fw-medium mb-0" htmlFor="ds-speed">{speedLabel}</label>
            <input id="ds-speed" aria-label={t("home.playbackSpeed")} type="range" min="0.5" max="2" step="0.25" value={playbackSpeed} onChange={(event) => onPlaybackSpeedChange(Number(event.target.value))} />
          </div>
        </div>
      ) : (
        <p className="text-center text-body-secondary small mt-3 mb-0">{t("home.solvePrompt")}</p>
      )}

      {footer ? <div className="mt-3">{footer}</div> : null}
    </Surface>
  );
}
