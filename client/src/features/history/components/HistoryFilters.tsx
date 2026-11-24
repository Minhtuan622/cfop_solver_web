import { Search } from "@/components/ui/Icon";
import { Input } from "@/components/ui/FormControls";
import { Select } from "@/components/ui/Select";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  TIMER_EVENTS,
  timerEventLabel,
  type TimerEventId,
} from "@/lib/timerEvents";
import type { HistoryFilter } from "../lib/historyView";

export function HistoryFilters({
  filter,
  tags,
  onChange,
}: {
  filter: HistoryFilter;
  tags: string[];
  onChange: (patch: Partial<HistoryFilter>) => void;
}) {
  const { language, t } = useLanguage();
  return (
    <div className="mt-4 grid grid-cols-12 items-center gap-2">
      <div className="col-span-12 lg:col-span-6">
        <label className="sr-only" htmlFor="history-search">
          {t("history.searchLabel")}
        </label>
        <div className="flex w-full items-stretch">
          <span className="inline-flex items-center bg-surface-2 px-3 text-sm text-muted first:rounded-l-field last:rounded-r-field">
            <Search className="text-base" />
          </span>
          <Input
            id="history-search"
            value={filter.query}
            onChange={event => onChange({ query: event.target.value })}
            placeholder={t("history.searchLabel")}
          />
        </div>
      </div>
      <div className="col-span-6 lg:col-span-3">
        <label className="sr-only" htmlFor="history-event-filter">
          {t("history.eventFilterLabel")}
        </label>
        <Select
          id="history-event-filter"
          value={filter.eventFilter}
          onChange={event =>
            onChange({ eventFilter: event.target.value as "all" | TimerEventId })
          }
        >
          <option value="all">{t("history.allEvents")}</option>
          {TIMER_EVENTS.map(event => (
            <option key={event.id} value={event.id}>
              {timerEventLabel(event.id, language)}
            </option>
          ))}
        </Select>
      </div>
      <div className="col-span-6 lg:col-span-3">
        <label className="sr-only" htmlFor="history-tag-filter">
          {t("history.tagFilterLabel")}
        </label>
        <Select
          id="history-tag-filter"
          value={filter.tag}
          onChange={event => onChange({ tag: event.target.value })}
        >
          <option value="all">{t("history.allTags")}</option>
          {tags.map(item => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
