import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { LaneProgressMap } from "../lib/studyLaneProgress";

export type StudyLane =
  | "lastLayer"
  | "bld"
  | "cfop"
  | "twoByTwo"
  | "pyraminx"
  | "skewb"
  | "roux"
  | "sq1"
  | "parity"
  | "l2e"
  | "l3t"
  | "l3t2";

export type StudyToolbarProps = {
  lane: StudyLane;
  onLaneChange: (lane: StudyLane) => void;
  reviewedToday: number;
  dailyGoal: number;
  goalPercent: number;
  hint?: string;
  queueCount: number;
  masteredCount: number;
  catalogCount: number;
  progress?: LaneProgressMap;
};

const LANES: ReadonlyArray<{ id: StudyLane; labelKey: string }> = [
  { id: "lastLayer", labelKey: "study.laneLastLayer" },
  { id: "bld", labelKey: "study.laneBld" },
  { id: "cfop", labelKey: "study.laneCfop" },
  { id: "twoByTwo", labelKey: "study.laneTwoByTwo" },
  { id: "pyraminx", labelKey: "study.lanePyraminx" },
  { id: "skewb", labelKey: "study.laneSkewb" },
  { id: "roux", labelKey: "study.laneRoux" },
  { id: "sq1", labelKey: "study.laneSq1" },
  { id: "parity", labelKey: "study.laneParity" },
  { id: "l2e", labelKey: "study.laneL2E" },
  { id: "l3t", labelKey: "study.laneL3T" },
  { id: "l3t2", labelKey: "study.laneL3T2" },
];

export function StudyToolbar({
  lane,
  onLaneChange,
  reviewedToday,
  dailyGoal,
  goalPercent,
  queueCount,
  masteredCount,
  catalogCount,
  progress = {},
}: StudyToolbarProps) {
  const { t } = useLanguage();

  return (
    <div>
      <div
        className="scroll-fade-x -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:[mask-image:none] sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6"
        role="group"
        aria-label={t("study.laneLabel")}
      >
        {LANES.map(({ id, labelKey }) => {
          const active = lane === id;
          const known =
            active && catalogCount > 0
              ? { mastered: masteredCount, total: catalogCount }
              : progress[id];
          const percent = known?.total
            ? Math.round((known.mastered / known.total) * 100)
            : 0;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => onLaneChange(id)}
              className={cn(
                "flex w-40 shrink-0 flex-col gap-1.5 rounded-panel px-4 py-3 text-left transition-colors focus-visible:ring-4 focus-visible:ring-primary/20 sm:w-auto",
                active
                  ? "bg-primary-soft text-ink"
                  : "bg-surface text-ink hover:bg-surface-2"
              )}
            >
              <span
                className={cn(
                  "text-sm font-semibold",
                  active && "text-primary"
                )}
              >
                {t(labelKey)}
              </span>
              <span className="text-xs tabular-nums text-muted">
                {known
                  ? t("study.laneProgress", {
                      mastered: known.mastered,
                      total: known.total,
                    })
                  : t("study.laneNotStarted")}
              </span>
              <span
                className="h-1 w-full overflow-hidden rounded-full bg-surface-3"
                aria-hidden="true"
              >
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${percent}%` }}
                />
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="mb-0 whitespace-nowrap text-sm tabular-nums text-muted">
          <strong className="font-semibold text-ink">
            {reviewedToday}/{dailyGoal}
          </strong>{" "}
          {t("study.inlineToday")}{" "}
          <span aria-hidden="true">·</span>{" "}
          <strong className="font-semibold text-ink">{queueCount}</strong>{" "}
          {t("study.inlineQueue")}
        </p>
        <div
          className="h-1 min-w-24 flex-1 overflow-hidden rounded-full bg-surface-3"
          role="progressbar"
          aria-label={t("study.goalProgress")}
          aria-valuenow={goalPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${goalPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
