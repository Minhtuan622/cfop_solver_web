import {
  BoxIcon,
  Grid,
  Pause,
  Play,
  RotateCcw,
  SkipEnd,
  SkipStart,
} from "@/components/ui/Icon";
import {
  PillBar,
  PillGroup,
  RoundButton,
  Surface,
} from "@/components/ui/DesignSystem";
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
  onPlaybackSpeedChange,
  footer,
  children,
}: SolverSolutionPanelProps) {
  const { t } = useLanguage();
  const speedLabel = t("home.speedValue", { speed: playbackSpeed.toFixed(1) });

  return (
    <Surface className="p-4 lg:p-6">
      <div className="relative rounded-panel bg-[radial-gradient(ellipse_at_bottom,rgba(91,91,214,0.16),rgba(8,145,178,0.06)_48%,transparent_72%)] px-3 pb-3 pt-14">
        {hasResult ? (
          <div
            className="absolute left-4 top-3 z-10 flex max-w-[calc(100%-13rem)] flex-wrap items-center gap-x-2 rounded-full border border-line/70 bg-surface/90 px-3.5 py-1.5 text-sm shadow-soft backdrop-blur"
            title={typeof subtitle === "string" ? subtitle : undefined}
          >
            {eyebrow ? (
              <span className="text-muted mr-2">{eyebrow}</span>
            ) : null}
            <strong>{title}</strong>
            {move ? (
              <span className="text-muted ml-2">
                {moveLabel}: <strong className="text-ink">{move}</strong>
              </span>
            ) : null}
          </div>
        ) : null}
        <PillBar
          variant="soft"
          className="absolute right-4 top-3 z-10 border border-line/60 bg-surface/90 backdrop-blur"
        >
          <PillGroup<"2d" | "3d">
            size="sm"
            label={t("home.viewLabel")}
            value={view}
            onChange={onViewChange}
            options={[
              {
                value: "3d",
                label: t("home.view3d"),
                icon: <BoxIcon aria-hidden="true" />,
              },
              {
                value: "2d",
                label: t("home.view2d"),
                icon: <Grid aria-hidden="true" />,
              },
            ]}
          />
        </PillBar>
        <div className="pt-2">{children}</div>
      </div>

      {hasResult ? (
        <div className="mx-auto mt-4 flex w-fit max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-line/70 bg-surface px-3 py-2 shadow-soft">
          <RoundButton
            label={t("guide.previous")}
            icon={<SkipStart />}
            onClick={() => onStep(-1)}
            disabled={cursor === 0}
          />
          <RoundButton
            tone="primary"
            size="lg"
            label={playing ? t("guide.pause") : t("guide.play")}
            icon={playing ? <Pause /> : <Play />}
            onClick={onTogglePlay}
            disabled={cursor === turnCount}
          />
          <RoundButton
            label={t("guide.next")}
            icon={<SkipEnd />}
            onClick={() => onStep(1)}
            disabled={cursor === turnCount}
          />
          <RoundButton
            label={t("guide.reset")}
            icon={<RotateCcw />}
            onClick={onReset}
          />
          <span
            className="mx-1 hidden h-6 w-px self-center bg-line sm:block"
            aria-hidden="true"
          />
          <div className="min-w-36 px-2 text-sm">
            <label className="block font-medium mb-0" htmlFor="ds-speed">
              {speedLabel}
            </label>
            <input
              id="ds-speed"
              className="w-full accent-primary"
              aria-label={t("home.playbackSpeed")}
              type="range"
              min="0.5"
              max="2"
              step="0.25"
              value={playbackSpeed}
              onChange={event =>
                onPlaybackSpeedChange(Number(event.target.value))
              }
            />
          </div>
        </div>
      ) : (
        <p className="text-center text-muted text-sm mt-4 mb-0">
          {t("home.solvePrompt")}
        </p>
      )}

      {footer ? <div className="mt-4">{footer}</div> : null}
    </Surface>
  );
}
