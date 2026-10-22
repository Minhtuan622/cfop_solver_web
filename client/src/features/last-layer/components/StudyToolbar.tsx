import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export type StudyLane = "lastLayer" | "bld";

export type StudyToolbarProps = {
  lane: StudyLane;
  onLaneChange: (lane: StudyLane) => void;
  /** Cases reviewed today, against the daily goal. */
  reviewedToday: number;
  dailyGoal: number;
  goalPercent: number;
  /** A short line under the goal bar, e.g. how many cases are queued. */
  hint?: string;
  /** Cases waiting in the priority queue. */
  queueCount: number;
  /** Cases already marked as mastered, out of the whole catalog. */
  masteredCount: number;
  catalogCount: number;
};

/**
 * The slim bar above the study workspace: which lane you are in, how far the
 * daily goal has gone, and how much is left to learn.
 */
export function StudyToolbar({
  lane,
  onLaneChange,
  reviewedToday,
  dailyGoal,
  goalPercent,
  hint,
  queueCount,
  masteredCount,
  catalogCount,
}: StudyToolbarProps) {
  const { t } = useLanguage();

  return (
    <div className="cfop-study-bar">
      <div className="cfop-study-bar__row">
        <div className="cfop-study-bar__group" role="group" aria-label={t("study.laneLabel")}>
          <button
            type="button"
            aria-pressed={lane === "lastLayer"}
            onClick={() => onLaneChange("lastLayer")}
            className={cn("btn btn-sm", lane === "lastLayer" ? "btn-primary" : "btn-outline-secondary")}
          >
            {t("study.laneLastLayer")}
          </button>
          <button
            type="button"
            aria-pressed={lane === "bld"}
            onClick={() => onLaneChange("bld")}
            className={cn("btn btn-sm", lane === "bld" ? "btn-primary" : "btn-outline-secondary")}
          >
            {t("study.laneBld")}
          </button>
        </div>

        <div className="cfop-study-bar__goal">
          <div className="d-flex align-items-baseline justify-content-between gap-3">
            <span className="cfop-study-bar__label">{t("study.goalLabel")}</span>
            <strong className="small">
              {reviewedToday}/{dailyGoal} {t("study.reviewedUnit")}
            </strong>
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-label={t("study.goalProgress")}
            aria-valuenow={goalPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="progress-bar" style={{ width: `${goalPercent}%` }} />
          </div>
          {hint ? <p className="cfop-study-bar__hint mb-0">{hint}</p> : null}
        </div>

        <dl className="cfop-study-bar__stats mb-0">
          <div>
            <dt className="cfop-study-bar__label">{t("study.statQueue")}</dt>
            <dd className="mb-0">{queueCount}</dd>
          </div>
          <div>
            <dt className="cfop-study-bar__label">{t("study.statMastered")}</dt>
            <dd className="mb-0">
              {masteredCount}
              <span className="text-body-secondary">/{catalogCount}</span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
