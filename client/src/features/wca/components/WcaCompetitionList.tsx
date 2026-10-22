import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/lib/i18n";
import { monthLabel, type MonthGroup } from "../lib/wcaCalendar";
import { WcaCompetitionRow } from "./WcaCompetitionRow";

/**
 * The calendar itself: one section per month, each holding the competitions
 * that start in it. Reading the list is then a matter of scanning the months
 * instead of hunting through a wall of cards.
 */
export function WcaCompetitionList({ groups, language }: { groups: readonly MonthGroup[]; language: Language }) {
  const { t } = useLanguage();

  return (
    <div className="cfop-calendar">
      {groups.map((group) => (
        <section key={group.key} className="cfop-calendar-group" aria-labelledby={`wca-month-${group.key}`}>
          <div className="cfop-calendar-group__header">
            <h2 id={`wca-month-${group.key}`} className="cfop-calendar-group__title">
              {monthLabel(group.year, group.month, language)}
            </h2>
            <span className="cfop-calendar-group__count">{group.competitions.length}</span>
          </div>
          <ul className="cfop-calendar-list list-unstyled" aria-label={t("wca.listLabel")}>
            {group.competitions.map((competition) => (
              <WcaCompetitionRow key={competition.id} competition={competition} language={language} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
