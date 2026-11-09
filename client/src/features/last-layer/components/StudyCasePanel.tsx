import { Check, Dices, Sparkles } from "@/components/ui/Icon";
import { Cube3DGuide } from "@/components/common/Cube3DGuide";
import { CubeNet } from "@/components/common/CubeNet";
import {
  SolveTimer,
  type TimerCompletion,
} from "@/components/common/SolveTimer";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatTimerReadout } from "@/lib/solveHistory";
import type { LastLayerCatalogCase } from "@/lib/solverRuntime";

export type StudyCasePanelProps = {
  activeCase: LastLayerCatalogCase | null;
  loading: boolean;
  mastered: boolean;
  view: "2d" | "3d";
  onViewChange: (view: "2d" | "3d") => void;
  showAlgorithm: boolean;
  onToggleAlgorithm: () => void;
  onToggleMastered: () => void;
  /** The time of the drill that just finished, in milliseconds. */
  lastElapsed: number | null;
  onTimerComplete: (completion: TimerCompletion) => void;
  /** Bumped to restart the timer after every grade. */
  timerVersion: number;
  crossColor: string;
  onGrade: (grade: "again" | "hard" | "good" | "easy") => void;
  /** Pull the next case out of the priority queue. */
  onChooseNext: () => void;
  /** Whether there is anything left to pull. */
  canChooseNext: boolean;
};

/**
 * The practice card: the case itself on the left, the recall drill and its
 * self-grade on the right.
 */
export function StudyCasePanel({
  activeCase,
  loading,
  mastered,
  view,
  onViewChange,
  showAlgorithm,
  onToggleAlgorithm,
  onToggleMastered,
  lastElapsed,
  onTimerComplete,
  timerVersion,
  crossColor,
  onGrade,
  onChooseNext,
  canChooseNext,
}: StudyCasePanelProps) {
  const { t } = useLanguage();

  if (!activeCase) {
    return (
      <section className="h-full rounded-card border border-line/80 bg-surface shadow-soft">
        <div className="p-5 sm:p-6">
          <p className="mb-1 text-sm font-semibold tracking-wide text-muted uppercase">
            {t("study.queueLabel")}
          </p>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            {loading ? t("study.loadingCases") : t("study.emptyCases")}
          </h2>
          {loading ? (
            <p
              className="mt-4 flex items-center gap-2 text-sm text-muted"
              role="status"
            >
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                aria-hidden="true"
              />
              {t("study.loadingCatalog")}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      className="h-full rounded-card border border-line/80 bg-surface shadow-soft"
      aria-label={t("study.caseLabel")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
            {t("study.caseLabel")}
          </p>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            {activeCase.family.toUpperCase()} · {activeCase.group} ·{" "}
            {activeCase.id}
          </h2>
        </div>
        <span
          className={
            mastered
              ? "inline-flex items-center rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-white"
              : "inline-flex items-center rounded-full bg-surface-3 px-2.5 py-1 text-[11px] font-semibold text-ink"
          }
        >
          {mastered ? t("study.mastered") : t("study.learning")}
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={onChooseNext}
            disabled={!canChooseNext}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Dices className="text-base" />
            {t("study.chooseNext")}
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div
                className="inline-flex flex-wrap items-center gap-1 text-xs"
                role="group"
                aria-label={t("study.viewLabel")}
              >
                <button
                  type="button"
                  aria-pressed={view === "2d"}
                  onClick={() => onViewChange("2d")}
                  className={
                    view === "2d"
                      ? "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:bg-primary-hover"
                      : "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface-2"
                  }
                >
                  2D
                </button>
                <button
                  type="button"
                  aria-pressed={view === "3d"}
                  onClick={() => onViewChange("3d")}
                  className={
                    view === "3d"
                      ? "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:bg-primary-hover"
                      : "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface-2"
                  }
                >
                  3D
                </button>
              </div>
              <span className="text-sm text-muted">
                {t("study.viewRecallTime")}
              </span>
            </div>

            {view === "2d" ? (
              <div className="rounded-xl border border-line bg-surface-2 p-4 text-center">
                <CubeNet state={activeCase.state} />
              </div>
            ) : (
              <Cube3DGuide
                state={activeCase.state}
                step={0}
                crossColor={crossColor}
                alignCross
                lastLayerCase={{ family: activeCase.family, id: activeCase.id }}
              />
            )}

            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
              <button
                type="button"
                onClick={onToggleAlgorithm}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-surface-2"
              >
                {showAlgorithm ? (
                  <Check className="text-base" />
                ) : (
                  <Sparkles className="text-base" />
                )}
                {showAlgorithm
                  ? t("study.hideAlgorithm")
                  : t("study.showAlgorithm")}
              </button>
              <button
                type="button"
                onClick={onToggleMastered}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-surface-2"
              >
                <Check className="text-base" />
                {mastered ? t("study.unmarkMastered") : t("study.markMastered")}
              </button>
            </div>

            {showAlgorithm ? (
              <pre className="mt-4 rounded-xl border border-line bg-surface-2 p-4 font-mono text-wrap">
                {activeCase.algorithm}
              </pre>
            ) : null}
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="h-full rounded-card border border-line/80 bg-surface shadow-soft">
              <div className="p-5 sm:p-6">
                <p className="mb-1 text-sm font-semibold tracking-wide text-muted uppercase">
                  {t("study.recallTitle")}
                </p>
                <h3 className="text-base font-semibold tracking-tight text-ink">
                  {t("study.timeThisCase")}
                </h3>
                <p className="text-sm text-muted">{t("study.recallHint")}</p>

                <SolveTimer
                  key={timerVersion}
                  onComplete={onTimerComplete}
                  soundEnabled={false}
                  inspectionEnabled={false}
                />

                <div className="mt-4 border-t border-line pt-4">
                  <p className="mb-2 text-sm text-muted">
                    {lastElapsed === null
                      ? t("study.stopToGrade")
                      : `${t("study.result")} · ${formatTimerReadout(lastElapsed)}`}
                  </p>
                  {lastElapsed !== null ? (
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        <GradeButton
                          label={t("study.gradeAgain")}
                          tone="red"
                          onClick={() => onGrade("again")}
                        />
                      </div>
                      <div className="col-span-6">
                        <GradeButton
                          label={t("study.gradeHard")}
                          tone="ink"
                          onClick={() => onGrade("hard")}
                        />
                      </div>
                      <div className="col-span-6">
                        <GradeButton
                          label={t("study.gradeGood")}
                          tone="mint"
                          onClick={() => onGrade("good")}
                        />
                      </div>
                      <div className="col-span-6">
                        <GradeButton
                          label={t("study.gradeEasy")}
                          tone="mint"
                          onClick={() => onGrade("easy")}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GradeButton({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: "red" | "ink" | "mint";
  onClick: () => void;
}) {
  const className =
    tone === "red"
      ? "inline-flex items-center justify-center rounded-full border border-danger/35 bg-transparent px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger-soft"
      : tone === "mint"
        ? "inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:bg-primary-hover"
        : "inline-flex items-center justify-center rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface-2";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${className} w-full`}
    >
      {label}
    </button>
  );
}
