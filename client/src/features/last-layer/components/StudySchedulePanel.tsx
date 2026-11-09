import { Sparkles, TimerReset } from "@/components/ui/Icon";
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
    <aside
      className="h-full rounded-card border border-line/80 bg-surface shadow-soft"
      aria-label={t("study.scheduleLabel")}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-semibold tracking-wide text-muted uppercase">
              {t("study.scheduleLabel")}
            </p>
            <h2 className="text-base font-semibold tracking-tight text-ink">
              {t("study.next7Days")}
            </h2>
          </div>
          <span className="inline-flex items-center rounded-full bg-surface-3 px-2.5 py-1 text-[11px] font-semibold text-ink">
            {totalDue} {t("study.due")}
          </span>
        </div>

        <div
          className="mt-4 grid grid-cols-3 gap-1 sm:grid-cols-7"
          role="list"
          aria-label={t("study.next7Days")}
        >
          {schedule.map(day => {
            const weekday = day.date
              .toLocaleDateString(locale, { weekday: "short" })
              .replace(".", "");
            return (
              <div key={day.date.toISOString()} role="listitem">
                <div
                  className={
                    day.isToday
                      ? "rounded-xl bg-primary px-3 py-2 text-center text-sm font-semibold text-white"
                      : "rounded-xl border border-line bg-surface px-3 py-2 text-center text-sm text-ink"
                  }
                >
                  <span className="block text-xs text-muted">{weekday}</span>
                  <b className="block text-base">{day.date.getDate()}</b>
                  <strong className="block text-sm tabular-nums text-primary">
                    {day.dueCount}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>

        {celebration ? (
          <div className="mt-4 flex items-center gap-2 rounded-panel border border-success/20 bg-success-soft px-4 py-3 text-sm text-ink">
            <Sparkles className="text-base text-success" />
            <span className="grow">{t("study.goalComplete")}</span>
            <button
              type="button"
              onClick={onDismissCelebration}
              className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface-3 hover:text-ink focus-visible:ring-4 focus-visible:ring-primary/20"
              aria-label={t("study.dismiss")}
            >
              ✕
            </button>
          </div>
        ) : null}

        <div className="mt-6 border-t border-line pt-4">
          <p className="mb-2 text-sm text-muted">{t("study.weakCases")}</p>
          <button
            type="button"
            onClick={onReviewWeakest}
            disabled={!weakCaseCount}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <TimerReset className="text-base" />
            {t("study.weakest")}
          </button>
        </div>
      </div>
    </aside>
  );
}
