import { TIMER_EVENTS, type TimerEventId } from "@/lib/timerEvents";

export type CompetitionPeriod = "week" | "month";

type Props = {
  period: CompetitionPeriod;
  onPeriodChange: (period: CompetitionPeriod) => void;
  eventId: TimerEventId | "all";
  onEventChange: (eventId: TimerEventId | "all") => void;
  idPrefix?: string;
};

export function CompetitionLeaderboardFilters({ period, onPeriodChange, eventId, onEventChange, idPrefix = "competition" }: Props) {
  return <div className="d-flex flex-wrap gap-2">
    <div className="btn-group" role="group" aria-label="Khoảng thời gian xếp hạng">
      <button type="button" className={`btn btn-sm ${period === "week" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => onPeriodChange("week")}>Tuần này</button>
      <button type="button" className={`btn btn-sm ${period === "month" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => onPeriodChange("month")}>Tháng này</button>
    </div>
    <label className="visually-hidden" htmlFor={`${idPrefix}-event`}>Bộ môn</label>
    <select id={`${idPrefix}-event`} className="form-select form-select-sm" value={eventId} onChange={(event) => onEventChange(event.target.value as TimerEventId | "all")}>
      <option value="all">Mọi bộ môn</option>
      {TIMER_EVENTS.map((item) => <option key={item.id} value={item.id}>{item.labelVi}</option>)}
    </select>
  </div>;
}
