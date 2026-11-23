import { Trophy } from "@/components/ui/Icon";
import { StatTile } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatSolveTime } from "@/lib/solveHistory";
import { meetsAo5Goal } from "../lib/profileProgress";

/** Bốn ô số liệu Timer/Study và banner khi ao5 đạt mục tiêu. */
export function ProfileTimerStats({
  solveCount,
  best,
  ao5,
  reviewedLastLayer,
  goalMs,
  goalLabel,
}: {
  solveCount: number;
  best: number | null;
  ao5: number | null;
  reviewedLastLayer: number;
  goalMs: number | null | undefined;
  goalLabel: string;
}) {
  const { t } = useLanguage();
  return (
    <>
      <section
        className="grid grid-cols-12 gap-4 mb-6"
        aria-label={t("profile.statsLabel")}
      >
        <div className="col-span-6 lg:col-span-3">
          <StatTile
            label={t("profile.statSolves")}
            value={String(solveCount)}
            detail={t("profile.statSolvesDetail")}
          />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <StatTile
            label={t("profile.statBest")}
            value={best === null ? "—" : formatSolveTime(best)}
            detail={t("profile.statBestDetail")}
          />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <StatTile
            label={t("profile.statAo5")}
            value={ao5 === null ? "—" : formatSolveTime(ao5)}
            detail={t("profile.statAo5Detail")}
          />
        </div>
        <div className="col-span-6 lg:col-span-3">
          <StatTile
            label={t("profile.statReview")}
            value={String(reviewedLastLayer)}
            detail={t("profile.statReviewDetail")}
          />
        </div>
      </section>

      {meetsAo5Goal(ao5, goalMs) ? (
        <section
          className="rounded-panel px-4 py-3 text-sm bg-success-soft text-ink flex flex-wrap items-center justify-between gap-4 mb-6"
          role="status"
        >
          <div>
            <h2 className="text-base font-semibold tracking-tight mb-1">
              <Trophy className="mr-2" />
              {t("profile.goalReachedTitle", { goal: goalLabel })}
            </h2>
            <p className="mb-0">
              {t("profile.goalReachedPrefix")}{" "}
              <strong>{formatSolveTime(ao5 ?? 0)}</strong>
              {t("profile.goalReachedSuffix")}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-success text-on-success text-base">
            {t("profile.goalReachedBadge")}
          </span>
        </section>
      ) : null}
    </>
  );
}
