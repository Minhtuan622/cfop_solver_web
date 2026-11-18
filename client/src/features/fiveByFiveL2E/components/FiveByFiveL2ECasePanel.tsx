/**
 * 5×5 L2E practice card: the case preview (3D — the algorithms are aimed at
 * the "two unpaired edges" position on a normal 5×5), the recall drill and
 * the Again/Hard/Good/Easy self-grade. Mirrors the other lanes.
 */
import { Check, Dices, Eye, EyeOff } from "@/components/ui/Icon";
import { lazy, Suspense } from "react";
import { fiveByFiveL2EScrambleOf } from "../lib/l2eAlg";
import {
  SolveTimer,
  type TimerCompletion,
} from "@/components/common/SolveTimer";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatTimerReadout } from "@/lib/solveHistory";
import { Button } from "@/components/ui/Button";
import type { FiveByFiveL2ECatalogCase } from "../lib/l2eCatalog";

const Puzzle3DCanvas = lazy(async () => ({
  default: (await import("@/features/puzzle-3d/components/Puzzle3DCanvas"))
    .Puzzle3DCanvas,
}));

export type FiveByFiveL2ECasePanelProps = {
  activeCase: FiveByFiveL2ECatalogCase | null;
  mastered: boolean;
  showAlgorithm: boolean;
  onToggleAlgorithm: () => void;
  onToggleMastered: () => void;
  lastElapsed: number | null;
  onTimerComplete: (completion: TimerCompletion) => void;
  /** Bumped to restart the timer after every grade. */
  timerVersion: number;
  language: "vi" | "en";
  onGrade: (grade: "again" | "hard" | "good" | "easy") => void;
  onChooseNext: () => void;
  canChooseNext: boolean;
};

export function FiveByFiveL2ECasePanel({
  activeCase,
  mastered,
  showAlgorithm,
  onToggleAlgorithm,
  onToggleMastered,
  lastElapsed,
  onTimerComplete,
  timerVersion,
  language,
  onGrade,
  onChooseNext,
  canChooseNext,
}: FiveByFiveL2ECasePanelProps) {
  const { t } = useLanguage();

  if (!activeCase) {
    return (
      <section className="h-full rounded-card bg-surface">
        <div className="p-5 sm:p-6">
          <p className="mb-1 text-sm font-semibold tracking-wide text-muted uppercase">
            {t("study.queueLabel")}
          </p>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            {t("study.emptyCases")}
          </h2>
        </div>
      </section>
    );
  }

  const setupAlg = fiveByFiveL2EScrambleOf(activeCase.algorithm);

  return (
    <section
      className="h-full rounded-card bg-surface"
      aria-label={t("study.caseLabel")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
            {t("l2e.caseLabel")}
          </p>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            {activeCase.name}
          </h2>
        </div>
        <span
          className={
            mastered
              ? "inline-flex items-center rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-on-success"
              : "inline-flex items-center rounded-full bg-surface-3 px-2.5 py-1 text-[11px] font-semibold text-ink"
          }
        >
          {mastered ? t("study.mastered") : t("study.learning")}
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            variant="secondary"
            size="plain"
            className="px-3 py-1.5 text-xs"
            onClick={onChooseNext}
            disabled={!canChooseNext}
          >
            <Dices className="text-base" />
            {t("study.chooseNext")}
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-7">
            <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
              <span className="text-sm text-muted">
                {t("study.viewRecallTime")}
              </span>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-surface-2">
              <Suspense
                fallback={
                  <div className="flex h-64 items-center justify-center text-sm text-muted">
                    {t("l2e.loading3d")}
                  </div>
                }
              >
                <Puzzle3DCanvas
                  eventId="555"
                  puzzle="5x5x5"
                  scramble={setupAlg}
                  language={language}
                />
              </Suspense>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="plain"
                className="px-3 py-1.5 text-xs"
                onClick={onToggleAlgorithm}
              >
                {showAlgorithm ? (
                  <EyeOff className="text-base" />
                ) : (
                  <Eye className="text-base" />
                )}
                {showAlgorithm
                  ? t("study.hideAlgorithm")
                  : t("study.showAlgorithm")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="plain"
                className="px-3 py-1.5 text-xs"
                onClick={onToggleMastered}
              >
                <Check className="text-base" />
                {mastered ? t("study.unmarkMastered") : t("study.markMastered")}
              </Button>
            </div>

            {showAlgorithm ? (
              <pre className="mt-4 rounded-xl bg-surface-2 p-4 font-mono text-wrap">
                {activeCase.algorithm}
              </pre>
            ) : null}
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="h-full rounded-card bg-surface-2">
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

                <div className="mt-4">
                  <p className="mb-2 text-sm text-muted">
                    {lastElapsed === null
                      ? t("study.stopToGrade")
                      : `${t("study.result")} A� ${formatTimerReadout(lastElapsed)}`}
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
      ? "inline-flex items-center justify-center rounded-full bg-transparent px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger-soft"
      : tone === "mint"
        ? "inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-hover"
        : "inline-flex items-center justify-center rounded-full bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface-2";
  return (
    <button type="button" onClick={onClick} className={`${className} w-full`}>
      {label}
    </button>
  );
}
