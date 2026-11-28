import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { CompetitionResultsView } from "./CompetitionResultsView";
import { PsychSheetView } from "./PsychSheetView";
import { ScheduleView } from "./ScheduleView";

const SECTIONS = ["results", "psych", "schedule"] as const;
type Section = (typeof SECTIONS)[number];

// Results, psych sheet and schedule of one competition. With `personal` the
// schedule also shows the signed-in competitor's own groups and judging jobs.
export function CompetitionExplorer({
  competitionId,
  eventIds,
  personal = false,
  highlightWcaId: highlightOverride = null,
  initial = "results",
}: {
  competitionId: string;
  eventIds: readonly string[];
  personal?: boolean;
  highlightWcaId?: string | null;
  initial?: Section;
}) {
  const { t } = useLanguage();
  const profile = trpc.cfopAccount.wca.profile.useQuery(undefined, { enabled: personal, staleTime: 10 * 60 * 1000, retry: false });
  const highlightWcaId = highlightOverride ?? profile.data?.wcaId ?? null;
  const [section, setSection] = useState<Section>(initial);
  return (
    <section>
      <h4 className="mb-2 mt-0 text-sm font-semibold tracking-tight text-ink">{t("wcax.explorer")}</h4>
      <div role="tablist" aria-label={t("wcax.explorer")} className="mb-4 flex flex-wrap gap-2">
        {SECTIONS.map(id => (
          <Button
            key={id}
            type="button"
            role="tab"
            aria-selected={section === id}
            variant={section === id ? "primary" : "secondary"}
            size="sm"
            onClick={() => setSection(id)}
          >
            {t(`wcax.section.${id}`)}
          </Button>
        ))}
      </div>
      {section === "results" ? <CompetitionResultsView competitionId={competitionId} /> : null}
      {section === "psych" ? (
        <PsychSheetView competitionId={competitionId} eventIds={eventIds} highlightWcaId={highlightWcaId} />
      ) : null}
      {section === "schedule" ? <ScheduleView competitionId={competitionId} personal={personal} /> : null}
    </section>
  );
}
