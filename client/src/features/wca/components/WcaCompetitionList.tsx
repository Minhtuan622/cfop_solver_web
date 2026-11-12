import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/lib/i18n";
import { monthLabel, type MonthGroup } from "../lib/wcaCalendar";
import { WcaCompetitionRow } from "./WcaCompetitionRow";

/**
 * The calendar itself: one section per month, each holding the competitions
 * that start in it. Reading the list is then a matter of scanning the months
 * instead of hunting through a wall of cards.
 */
export function WcaCompetitionList({
  groups,
  language,
}: {
  groups: readonly MonthGroup[];
  language: Language;
}) {
  const { t } = useLanguage();

  return (
    <div className="grid gap-6">
      {groups.map(group => (
        <section
          key={group.key}
          className="rounded-card bg-surface p-5 sm:p-6"
          aria-labelledby={`wca-month-${group.key}`}
        >
          <div className="flex items-center justify-between gap-2 border-b pb-3">
            <h2
              id={`wca-month-${group.key}`}
              className="text-xs font-semibold tracking-[0.06em] text-muted uppercase"
            >
              {monthLabel(group.year, group.month, language)}
            </h2>
            <span className="rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-semibold text-ink">
              {group.competitions.length}
            </span>
          </div>
          <ul
            className="mt-4 divide-y divide-line"
            aria-label={t("wca.listLabel")}
          >
            {group.competitions.map(competition => (
              <WcaCompetitionRow
                key={competition.id}
                competition={competition}
                language={language}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
