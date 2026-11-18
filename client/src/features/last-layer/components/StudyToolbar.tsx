import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export type StudyLane =
  | "lastLayer"
  | "bld"
  | "cfop"
  | "twoByTwo"
  | "pyraminx"
  | "skewb"
  | "sq1"
  | "parity"
  | "l2e";

export type StudyToolbarProps = {
  lane: StudyLane;
  onLaneChange: (lane: StudyLane) => void;
  /** Cases reviewed today, against the daily goal. */
  reviewedToday: number;
  dailyGoal: number;
  goalPercent: number;
  /** Unused legacy prop, kept so callers don't break. */
  hint?: string;
  /** Cases waiting in the priority queue. */
  queueCount: number;
  /** Cases already marked as mastered, out of the whole catalog. */
  masteredCount: number;
  catalogCount: number;
};

const LANES: ReadonlyArray<{ id: StudyLane; labelKey: string }> = [
  { id: "lastLayer", labelKey: "study.laneLastLayer" },
  { id: "bld", labelKey: "study.laneBld" },
  { id: "cfop", labelKey: "study.laneCfop" },
  { id: "twoByTwo", labelKey: "study.laneTwoByTwo" },
  { id: "pyraminx", labelKey: "study.lanePyraminx" },
  { id: "skewb", labelKey: "study.laneSkewb" },
  { id: "sq1", labelKey: "study.laneSq1" },
  { id: "parity", labelKey: "study.laneParity" },
  { id: "l2e", labelKey: "study.laneL2E" },
];

/**
 * Ultra-slim lane strip: which lane you are in, today's reviews, the queue
 * and how much is mastered — one line of muted text under a single row of
 * lane pills, plus a hairline goal bar. No card, no big stat blocks.
 */
export function StudyToolbar({
  lane,
  onLaneChange,
  reviewedToday,
  dailyGoal,
  goalPercent,
  queueCount,
  masteredCount,
  catalogCount,
}: StudyToolbarProps) {
  const { t } = useLanguage();

  const laneButtonClass = (next: StudyLane) =>
    cn(
      "inline-flex shrink-0 items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold leading-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
      lane === next
        ? "bg-primary text-on-primary hover:bg-primary-hover"
        : "bg-surface text-ink hover:bg-surface-2",
    );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div
          className="inline-flex max-w-full items-center gap-1 overflow-x-auto whitespace-nowrap"
          role="group"
          aria-label={t("study.laneLabel")}
        >
          {LANES.map(({ id, labelKey }) => (
            <button
              key={id}
              type="button"
              aria-pressed={lane === id}
              onClick={() => onLaneChange(id)}
              className={laneButtonClass(id)}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        <p className="mb-0 whitespace-nowrap text-xs tabular-nums text-muted">
          <strong className="font-semibold text-ink">
            {reviewedToday}/{dailyGoal}
          </strong>{" "}
          {t("study.inlineToday")}{" "}
          <span aria-hidden="true">·</span>{" "}
          <strong className="font-semibold text-ink">{queueCount}</strong>{" "}
          {t("study.inlineQueue")}{" "}
          <span aria-hidden="true">·</span>{" "}
          <strong className="font-semibold text-ink">
            {masteredCount}/{catalogCount}
          </strong>{" "}
          {t("study.inlineMastered")}
        </p>
      </div>

      <div
        className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-surface-3"
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
    </div>
  );
}
