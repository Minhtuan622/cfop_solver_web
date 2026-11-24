import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CaseStudyLaneShell,
  useCaseStudyLane,
  type CaseStudyLaneStats,
} from "@/features/case-study";
import { FiveByFiveL2ECasePanel } from "./FiveByFiveL2ECasePanel";
import { FiveByFiveL2ECatalogPanel } from "./FiveByFiveL2ECatalogPanel";
import {
  FIVE_BY_FIVE_L2E_COUNTS,
  L2E_CATALOG,
  type FiveByFiveL2ECatalogCase,
} from "../lib/l2eCatalog";
import {
  exportFiveByFiveL2EStudy,
  gradeFiveByFiveL2ECase,
  importFiveByFiveL2EStudy,
  readFiveByFiveL2EStudy,
  readMasteredFiveByFiveL2ECaseKeys,
  writeFiveByFiveL2EStudy,
  writeMasteredFiveByFiveL2ECaseKeys,
} from "../lib/l2eStudy";

const STORE = {
  read: readFiveByFiveL2EStudy,
  write: writeFiveByFiveL2EStudy,
  readMasteredKeys: readMasteredFiveByFiveL2ECaseKeys,
  writeMasteredKeys: writeMasteredFiveByFiveL2ECaseKeys,
  grade: gradeFiveByFiveL2ECase,
  importStudy: importFiveByFiveL2EStudy,
};

export function FiveByFiveL2EStudyLab({
  language,
  onStatsChange,
}: {
  language: "vi" | "en";
  onStatsChange?: (stats: CaseStudyLaneStats) => void;
}) {
  const { t } = useLanguage();
  const catalog = useMemo(() => [...L2E_CATALOG], []);
  const lane = useCaseStudyLane<FiveByFiveL2ECatalogCase, ReturnType<typeof gradeFiveByFiveL2ECase>>({
    store: STORE,
    catalog,
    onStatsChange,
  });

  return (
    <CaseStudyLaneShell
      lane={lane}
      summary={t("l2e.laneSummary", { count: FIVE_BY_FIVE_L2E_COUNTS.l2e })}
      backupFileName="cfop-5x5l2e-study-backup.json"
      exportBackup={() => exportFiveByFiveL2EStudy(lane.study, lane.masteredKeys)}
      casePanel={
        <FiveByFiveL2ECasePanel
          {...lane.casePanelProps}
          language={language}
        />
      }
      catalogPanel={
        <FiveByFiveL2ECatalogPanel {...lane.catalogPanelProps} />
      }
    />
  );
}
