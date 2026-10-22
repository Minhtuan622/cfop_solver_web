import { TIMER_EVENTS, timerEventLabel, type TimerEventId } from "@/lib/timerEvents";
import { useLanguage } from "@/contexts/LanguageContext";

export type CompetitionPeriod = "week" | "month";

type Props = {
  period: CompetitionPeriod;
  onPeriodChange: (period: CompetitionPeriod) => void;
  eventId: TimerEventId | "all";
  onEventChange: (eventId: TimerEventId | "all") => void;
  idPrefix?: string;
};

export function CompetitionLeaderboardFilters({ period, onPeriodChange, eventId, onEventChange, idPrefix = "competition" }: Props) {
  const { language, t } = useLanguage();
  return <div className="d-flex flex-wrap gap-2">
    <div className="btn-group" role="group" aria-label={t("competition.filter.periodLabel")}>
      <button type="button" className={`btn btn-sm ${period === "week" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => onPeriodChange("week")}>{t("competition.filter.week")}</button>
      <button type="button" className={`btn btn-sm ${period === "month" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => onPeriodChange("month")}>{t("competition.filter.month")}</button>
    </div>
    <label className="visually-hidden" htmlFor={`${idPrefix}-event`}>{t("competition.filter.eventLabel")}</label>
    <select id={`${idPrefix}-event`} className="form-select form-select-sm" value={eventId} onChange={(event) => onEventChange(event.target.value as TimerEventId | "all")}>
      <option value="all">{t("competition.filter.allEvents")}</option>
      {TIMER_EVENTS.map((item) => <option key={item.id} value={item.id}>{timerEventLabel(item.id, language)}</option>)}
    </select>
  </div>;
}
