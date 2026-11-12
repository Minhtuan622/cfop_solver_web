import { Sparkles, TimerReset } from "@/components/ui/Icon";
import { useLanguage } from "@/contexts/LanguageContext";
import type { WeeklyReviewDay } from "../lib/lastLayerStudy";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/StudioUI";
import { cn } from "@/lib/utils";

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
      className="h-full rounded-card bg-surface"
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
                      ? "rounded-xl bg-primary px-1.5 py-2 text-center text-sm font-semibold text-white"
                      : "rounded-xl bg-surface px-1.5 py-2 text-center text-sm text-ink"
                  }
                >
                  {/* Cột chỉ rộng ~45px: nhãn ngày phải nhỏ lại, nếu không
                      "Thứ 5" sẽ xuống dòng (đo được: 33px cần ở 12px, chỉ còn
                      33px trong ô). Không dùng `whitespace-nowrap` để khi thiếu
                      chỗ nó xuống dòng chứ không tràn ra ngoài ô.

                      Ô hôm nay nền tím nên chữ phải là chữ trắng: màu phụ
                      và màu tím trên nền tím không đọc được. */}
                  <span
                    className={cn(
                      "block text-[11px]",
                      day.isToday ? "text-white/85" : "text-muted"
                    )}
                  >
                    {weekday}
                  </span>
                  <b className="block text-base">{day.date.getDate()}</b>
                  <strong
                    className={cn(
                      "block text-sm tabular-nums",
                      day.isToday ? "text-white" : "text-primary"
                    )}
                  >
                    {day.dueCount}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>

        {celebration ? (
          <div className="mt-4 flex items-center gap-2 rounded-panel bg-success-soft px-4 py-3 text-sm text-ink">
            <Sparkles className="text-base text-success" />
            <span className="grow">{t("study.goalComplete")}</span>
            <IconButton
              className="ml-auto h-8 w-8 shrink-0 text-muted hover:bg-surface-3 hover:text-ink"
              label={t("study.dismiss")}
              icon={"✕"}
              onClick={onDismissCelebration}
            />
          </div>
        ) : null}

        <div className="mt-6 pt-4">
          <p className="mb-2 text-sm text-muted">{t("study.weakCases")}</p>
          <Button
            type="button"
            variant="secondary"
            size="plain"
            className="w-full px-4 py-2 text-sm"
            onClick={onReviewWeakest}
            disabled={!weakCaseCount}
          >
            <TimerReset className="text-base" />
            {t("study.weakest")}
          </Button>
        </div>
      </div>
    </aside>
  );
}
