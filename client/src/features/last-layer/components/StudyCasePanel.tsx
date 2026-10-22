import { Check, Dices, Sparkles } from "@/components/ui/BootstrapIcon";
import { Cube3DGuide } from "@/components/common/Cube3DGuide";
import { CubeNet } from "@/components/common/CubeNet";
import { SolveTimer, type TimerCompletion } from "@/components/common/SolveTimer";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatTimerReadout } from "@/lib/solveHistory";
import { cn } from "@/lib/utils";
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
      <section className="card cfop-card-surface h-100">
        <div className="card-body p-3 p-lg-4">
          <p className="small text-uppercase fw-semibold text-body-secondary mb-1">{t("study.queueLabel")}</p>
          <h2 className="h5 mb-0">{loading ? t("study.loadingCases") : t("study.emptyCases")}</h2>
          {loading ? (
            <p className="d-flex align-items-center gap-2 small text-body-secondary mt-3 mb-0" role="status">
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              {t("study.loadingCatalog")}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="card cfop-card-surface h-100" aria-label={t("study.caseLabel")}>
      <div className="cfop-solver-panel__header">
        <div className="cfop-solver-panel__heading">
          <p className="cfop-solver-eyebrow mb-1">{t("study.caseLabel")}</p>
          <h2 className="h5 mb-0">
            {activeCase.family.toUpperCase()} · {activeCase.group} · {activeCase.id}
          </h2>
        </div>
        <span className={cn("badge", mastered ? "text-bg-success" : "text-bg-secondary")}>
          {mastered ? t("study.mastered") : t("study.learning")}
        </span>
      </div>

      <div className="card-body p-3 p-lg-4">
        <div className="d-flex justify-content-end mb-3">
          <button type="button" onClick={onChooseNext} disabled={!canChooseNext} className="btn btn-outline-secondary btn-sm">
            <Dices className="fs-6 me-1" />
            {t("study.chooseNext")}
          </button>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div className="btn-group btn-group-sm" role="group" aria-label={t("study.viewLabel")}>
                <button
                  type="button"
                  aria-pressed={view === "2d"}
                  onClick={() => onViewChange("2d")}
                  className={cn("btn", view === "2d" ? "btn-primary" : "btn-outline-secondary")}
                >
                  2D
                </button>
                <button
                  type="button"
                  aria-pressed={view === "3d"}
                  onClick={() => onViewChange("3d")}
                  className={cn("btn", view === "3d" ? "btn-primary" : "btn-outline-secondary")}
                >
                  3D
                </button>
              </div>
              <span className="small text-body-secondary">{t("study.viewRecallTime")}</span>
            </div>

            {view === "2d" ? (
              <div className="border rounded bg-body-tertiary p-3 text-center">
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

            <div className="d-flex flex-wrap gap-2 border-top pt-3 mt-3">
              <button type="button" onClick={onToggleAlgorithm} className="btn btn-outline-secondary btn-sm">
                {showAlgorithm ? <Check className="fs-6 me-1" /> : <Sparkles className="fs-6 me-1" />}
                {showAlgorithm ? t("study.hideAlgorithm") : t("study.showAlgorithm")}
              </button>
              <button type="button" onClick={onToggleMastered} className="btn btn-outline-secondary btn-sm">
                <Check className="fs-6 me-1" />
                {mastered ? t("study.unmarkMastered") : t("study.markMastered")}
              </button>
            </div>

            {showAlgorithm ? (
              <pre className="bg-body-tertiary border rounded p-3 mt-3 text-wrap mb-0 font-monospace">
                {activeCase.algorithm}
              </pre>
            ) : null}
          </div>

          <div className="col-12 col-lg-5">
            <div className="card bg-body-tertiary border-0 h-100">
              <div className="card-body">
                <p className="small text-uppercase fw-semibold text-body-secondary mb-1">{t("study.recallTitle")}</p>
                <h3 className="h5">{t("study.timeThisCase")}</h3>
                <p className="small text-body-secondary">{t("study.recallHint")}</p>

                <SolveTimer
                  key={timerVersion}
                  onComplete={onTimerComplete}
                  soundEnabled={false}
                  inspectionEnabled={false}
                />

                <div className="border-top pt-3 mt-3">
                  <p className="small text-body-secondary mb-2">
                    {lastElapsed === null
                      ? t("study.stopToGrade")
                      : `${t("study.result")} · ${formatTimerReadout(lastElapsed)}`}
                  </p>
                  {lastElapsed !== null ? (
                    <div className="row g-2">
                      <div className="col-6">
                        <GradeButton label={t("study.gradeAgain")} tone="red" onClick={() => onGrade("again")} />
                      </div>
                      <div className="col-6">
                        <GradeButton label={t("study.gradeHard")} tone="ink" onClick={() => onGrade("hard")} />
                      </div>
                      <div className="col-6">
                        <GradeButton label={t("study.gradeGood")} tone="mint" onClick={() => onGrade("good")} />
                      </div>
                      <div className="col-6">
                        <GradeButton label={t("study.gradeEasy")} tone="mint" onClick={() => onGrade("easy")} />
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

function GradeButton({ label, tone, onClick }: { label: string; tone: "red" | "ink" | "mint"; onClick: () => void }) {
  const classes = tone === "red" ? "btn btn-outline-danger w-100" : tone === "mint" ? "btn btn-primary w-100" : "btn btn-outline-secondary w-100";
  return (
    <button type="button" onClick={onClick} className={classes}>
      {label}
    </button>
  );
}
