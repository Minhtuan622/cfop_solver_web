import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/lib/i18n";
import { monthLabel, type MonthGroup } from "../lib/wcaCalendar";
import { WcaCompetitionRow } from "./WcaCompetitionRow";

export function WcaCompetitionList({
  groups,
  language,
}: {
  groups: readonly MonthGroup[];
  language: Language;
}) {
  const { t } = useLanguage();

  return (
    <div className="grid gap-4">
      {groups.map(group => (
        <section
          key={group.key}
          aria-labelledby={`wca-month-${group.key}`}
        >
          <div className="flex items-baseline justify-between gap-2 px-3">
            <h2
              id={`wca-month-${group.key}`}
              className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted"
            >
              {monthLabel(group.year, group.month, language)}
            </h2>
            <span className="text-[11px] tabular-nums text-muted">
              {t("wca.resultsCount", { count: group.competitions.length })}
            </span>
          </div>
          <ul
            className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3"
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
