import { Sparkles, TimerReset } from "@/components/ui/BootstrapIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import type { WeeklyReviewDay } from "../lib/lastLayerStudy";

export type StudySchedulePanelProps = {
  schedule: WeeklyReviewDay[];
  totalDue: number;
  weakCaseCount: number;
  onReviewWeakest: () => void;
  celebration: boolean;
  onDismissCelebration: () => void;
};

/** The right column: what is due over the next seven days, and the weakest case. */
export function StudySchedulePanel({
  schedule,
  totalDue,
  weakCaseCount,
  onReviewWeakest,
  celebration,
  onDismissCelebration,
}: StudySchedulePanelProps) {
  const { language, t } = useLanguage();
  const locale = language === "vi" ? "vi-VN" : "en-US";

  return (
    <aside className="card cfop-card-surface h-100" aria-label={t("study.scheduleLabel")}>
      <div className="card-body p-3 p-lg-4">
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div>
            <p className="small text-uppercase fw-semibold text-body-secondary mb-1">{t("study.scheduleLabel")}</p>
            <h2 className="h5 mb-0">{t("study.next7Days")}</h2>
          </div>
          <span className="badge text-bg-secondary">
            {totalDue} {t("study.due")}
          </span>
        </div>

        <div className="row row-cols-7 g-1 mt-3" role="list" aria-label={t("study.next7Days")}>
          {schedule.map((day) => {
            const weekday = day.date.toLocaleDateString(locale, { weekday: "short" }).replace(".", "");
            return (
              <div key={day.date.toISOString()} role="listitem" className="col text-center small">
                <div className={day.isToday ? "cfop-study-day cfop-study-day--today" : "cfop-study-day"}>
                  <span className="d-block">{weekday}</span>
                  <b className="d-block">{day.date.getDate()}</b>
                  <strong>{day.dueCount}</strong>
                </div>
              </div>
            );
          })}
        </div>

        {celebration ? (
          <div className="alert alert-success mt-3 mb-0 d-flex align-items-center gap-2">
            <Sparkles className="fs-6" />
            <span className="flex-grow-1">{t("study.goalComplete")}</span>
            <button type="button" onClick={onDismissCelebration} className="btn-close" aria-label={t("study.dismiss")} />
          </div>
        ) : null}

        <div className="border-top mt-4 pt-3">
          <p className="small text-body-secondary mb-2">{t("study.weakCases")}</p>
          <button type="button" onClick={onReviewWeakest} disabled={!weakCaseCount} className="btn btn-outline-secondary w-100">
            <TimerReset className="fs-6 me-1" />
            {t("study.weakest")}
          </button>
        </div>
      </div>
    </aside>
  );
}
