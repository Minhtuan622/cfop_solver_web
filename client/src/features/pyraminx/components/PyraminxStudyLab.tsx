import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CaseStudyLaneShell,
  useCaseStudyLane,
  type CaseStudyLaneStats,
} from "@/features/case-study";
import { PyraminxCasePanel } from "./PyraminxCasePanel";
import { PyraminxCatalogPanel } from "./PyraminxCatalogPanel";
import {
  PYRAMINX_COUNTS,
  pyraminxCatalogOf,
  type PyraminxCatalogCase,
  type PyraminxFamily,
} from "../lib/pyraminxCatalog";
import {
  exportPyraminxStudy,
  gradePyraminxCase,
  importPyraminxStudy,
  readPyraminxStudy,
  readMasteredPyraminxCaseKeys,
  writePyraminxStudy,
  writeMasteredPyraminxCaseKeys,
} from "../lib/pyraminxStudy";

const STORE = {
  read: readPyraminxStudy,
  write: writePyraminxStudy,
  readMasteredKeys: readMasteredPyraminxCaseKeys,
  writeMasteredKeys: writeMasteredPyraminxCaseKeys,
  grade: gradePyraminxCase,
  importStudy: importPyraminxStudy,
};

export function PyraminxStudyLab({
  language,
  onStatsChange,
}: {
  language: "vi" | "en";
  onStatsChange?: (stats: CaseStudyLaneStats) => void;
}) {
  const { t } = useLanguage();
  const [family, setFamily] = useState<PyraminxFamily>("l4e");
  const catalog = useMemo(() => [...pyraminxCatalogOf(family)], [family]);
  const lane = useCaseStudyLane<PyraminxCatalogCase, ReturnType<typeof gradePyraminxCase>>({
    store: STORE,
    catalog,
    family,
    onStatsChange,
  });

  return (
    <CaseStudyLaneShell
      lane={lane}
      setPicker={{
        label: t("pyraminx.setLabel"),
        options: [
          { value: "ll", label: t("pyraminx.setLl", { count: PYRAMINX_COUNTS.ll }) },
          { value: "l4e", label: t("pyraminx.setL4e", { count: PYRAMINX_COUNTS.l4e }) },
        ],
        value: family,
        onChange: setFamily,
      }}
      summary={
        family === "ll"
          ? t("pyraminx.laneSummaryLl", { count: PYRAMINX_COUNTS.ll })
          : t("pyraminx.laneSummaryL4e", { count: PYRAMINX_COUNTS.l4e })
      }
      backupFileName="cfop-pyraminx-study-backup.json"
      exportBackup={() => exportPyraminxStudy(lane.study, lane.masteredKeys)}
      casePanel={
        <PyraminxCasePanel
          {...lane.casePanelProps}
          language={language}
        />
      }
      catalogPanel={
        <PyraminxCatalogPanel {...lane.catalogPanelProps} />
      }
    />
  );
}
