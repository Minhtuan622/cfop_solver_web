import { Calendar3, CircleGauge, Sparkles } from "@/components/ui/Icon";
import { useLanguage } from "@/contexts/LanguageContext";

export function TimerDigestChips({
  digest,
  ao5Text,
}: {
  digest: { streak: number; todayCount: number };
  ao5Text: string;
}) {
  const { t } = useLanguage();
  return (
    <div
      data-focus-hide
      className="mt-3 flex flex-wrap items-center gap-2"
      aria-label={t("timer.digestLabel")}
    >
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink">
        <Sparkles
          className="text-base text-muted"
          aria-hidden="true"
        />
        {t("timer.digestStreak", { days: digest.streak })}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink">
        <Calendar3
          className="text-base text-muted"
          aria-hidden="true"
        />
        {t("timer.digestToday", { count: digest.todayCount })}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink">
        <CircleGauge
          className="text-base text-muted"
          aria-hidden="true"
        />
        {t("timer.digestAo5", { value: ao5Text })}
      </span>
    </div>
  );
}
