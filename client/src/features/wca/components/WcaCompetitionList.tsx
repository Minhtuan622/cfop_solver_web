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
    <div className="grid gap-3">
      {groups.map(group => (
        <section
          key={group.key}
          className="rounded-card bg-surface p-3 sm:p-4"
          aria-labelledby={`wca-month-${group.key}`}
        >
          <div className="flex items-center justify-between gap-2">
            <h2
              id={`wca-month-${group.key}`}
              className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase"
            >
              {monthLabel(group.year, group.month, language)}
            </h2>
            <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-ink">
              {group.competitions.length}
            </span>
          </div>
          <ul
            className="mt-2 grid gap-1.5"
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
