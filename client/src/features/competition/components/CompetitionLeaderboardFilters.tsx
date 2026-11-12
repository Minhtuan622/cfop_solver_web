import {
  TIMER_EVENTS,
  timerEventLabel,
  type TimerEventId,
} from "@/lib/timerEvents";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/FormControls";

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
        <Button
          type="button"
          variant={period === "week" ? "primary" : "outline"}
          size="plain"
          className="px-4 py-2 text-xs leading-none border-0!"
          onClick={() => onPeriodChange("week")}
        >
          {t("competition.filter.week")}
        </Button>
        <Button
          type="button"
          variant={period === "month" ? "primary" : "outline"}
          size="plain"
          className="px-4 py-2 text-xs leading-none border-0!"
          onClick={() => onPeriodChange("month")}
        >
          {t("competition.filter.month")}
        </Button>
      </div>
      <label className="sr-only" htmlFor={`${idPrefix}-event`}>
        {t("competition.filter.eventLabel")}
      </label>
      <Select
        id={`${idPrefix}-event`}
        className="rounded-lg px-3 py-1.5 pr-8 text-xs"
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
      </Select>
    </div>
  );
}
