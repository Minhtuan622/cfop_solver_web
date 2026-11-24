import { BarChart3, Check, Clock3, Tag } from "@/components/ui/Icon";
import { StatTile } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatSolveTime, type SolveHistoryEntry } from "@/lib/solveHistory";
import { average } from "../lib/historyView";

export function HistoryStatTiles({
  filtered,
  valid,
}: {
  filtered: SolveHistoryEntry[];
  valid: number[];
}) {
  const { t } = useLanguage();
  const best = valid.length ? Math.min(...valid) : 0;
  const dnfCount = filtered.filter(item => item.penalty === "DNF").length;
  const plusTwoCount = filtered.filter(item => item.penalty === "+2").length;
  return (
    <section
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      aria-label={t("history.metricsLabel")}
    >
      <StatTile
        label={t("history.bestSingle")}
        value={formatSolveTime(best)}
        icon={<Clock3 className="text-lg" />}
      />
      <StatTile
        label={t("history.filteredAverage")}
        value={formatSolveTime(average(valid))}
        icon={<BarChart3 className="text-lg" />}
      />
      <StatTile
        label={t("history.validSolves")}
        value={`${valid.length}/${filtered.length}`}
        icon={<Check className="text-lg" />}
      />
      <StatTile
        label={t("history.penalties")}
        value={`+2 ${plusTwoCount} · DNF ${dnfCount}`}
        icon={<Tag className="text-lg" />}
      />
    </section>
  );
}
