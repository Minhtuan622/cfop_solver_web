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

  const laneButtonClass = (next: StudyLane) =>
    cn(
      "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold leading-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 px-3 py-1.5 text-xs",
      lane === next
        ? "bg-primary text-white hover:bg-primary-hover"
        : "bg-surface text-ink hover:bg-surface-2"
    );

  return (
    <div className="rounded-card bg-surface px-5 py-4">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className="inline-flex flex-wrap items-center gap-1"
          role="group"
          aria-label={t("study.laneLabel")}
        >
          <button
            type="button"
            aria-pressed={lane === "lastLayer"}
            onClick={() => onLaneChange("lastLayer")}
            className={laneButtonClass("lastLayer")}
          >
            {t("study.laneLastLayer")}
          </button>
          <button
            type="button"
            aria-pressed={lane === "bld"}
            onClick={() => onLaneChange("bld")}
            className={laneButtonClass("bld")}
          >
            {t("study.laneBld")}
          </button>
        </div>

        <div className="min-w-0 flex-1 basis-56">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
              {t("study.goalLabel")}
            </span>
            <strong className="text-sm tabular-nums text-ink">
              {reviewedToday}/{dailyGoal} {t("study.reviewedUnit")}
            </strong>
          </div>
          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-3"
            role="progressbar"
            aria-label={t("study.goalProgress")}
            aria-valuenow={goalPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${goalPercent}%` }}
            />
          </div>
          {hint ? <p className="mb-0 mt-2 text-xs text-muted">{hint}</p> : null}
        </div>

        <dl className="ml-auto mb-0 flex gap-6">
          <div>
            <dt className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
              {t("study.statQueue")}
            </dt>
            <dd className="mt-0.5 text-xl font-bold tabular-nums text-ink">
              {queueCount}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
              {t("study.statMastered")}
            </dt>
            <dd className="mt-0.5 text-xl font-bold tabular-nums text-ink">
              {masteredCount}
              <span className="text-sm font-medium text-muted">
                /{catalogCount}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
