import {
  TIMER_EVENTS,
  timerEventLabel,
  type TimerEventId,
} from "@/lib/timerEvents";
import { useLanguage } from "@/contexts/LanguageContext";

export type CompetitionPeriod = "week" | "month";

type Props = {
  period: CompetitionPeriod;
  onPeriodChange: (period: CompetitionPeriod) => void;
  eventId: TimerEventId | "all";
  onEventChange: (eventId: TimerEventId | "all") => void;
  idPrefix?: string;
};

export function CompetitionLeaderboardFilters({
  period,
  onPeriodChange,
  eventId,
  onEventChange,
  idPrefix = "competition",
}: Props) {
  const { language, t } = useLanguage();
  return (
    <div className="flex flex-wrap gap-2">
      <div
        className="inline-flex flex-wrap items-center gap-1"
        role="group"
        aria-label={t("competition.filter.periodLabel")}
      >
        <button
          type="button"
          className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold leading-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 px-3 py-1.5 text-xs ${
            period === "week"
              ? "bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover"
              : "border-primary/35 bg-transparent text-primary hover:bg-primary-soft"
          }`}
          onClick={() => onPeriodChange("week")}
        >
          {t("competition.filter.week")}
        </button>
        <button
          type="button"
          className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold leading-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 px-3 py-1.5 text-xs ${
            period === "month"
              ? "bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover"
              : "border-primary/35 bg-transparent text-primary hover:bg-primary-soft"
          }`}
          onClick={() => onPeriodChange("month")}
        >
          {t("competition.filter.month")}
        </button>
      </div>
      <label className="sr-only" htmlFor={`${idPrefix}-event`}>
        {t("competition.filter.eventLabel")}
      </label>
      <select
        id={`${idPrefix}-event`}
        className="w-full rounded-field border border-line bg-surface px-3.5 py-2.5 pr-9 text-sm text-ink shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 rounded-lg px-3 py-1.5 pr-8 text-xs"
        value={eventId}
        onChange={event =>
          onEventChange(event.target.value as TimerEventId | "all")
        }
      >
        <option value="all">{t("competition.filter.allEvents")}</option>
        {TIMER_EVENTS.map(item => (
          <option key={item.id} value={item.id}>
            {timerEventLabel(item.id, language)}
          </option>
        ))}
      </select>
    </div>
  );
}
