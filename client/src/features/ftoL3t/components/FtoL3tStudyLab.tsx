import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CaseStudyLaneShell,
  useCaseStudyLane,
  type CaseStudyLaneStats,
} from "@/features/case-study";
import { FtoL3tCasePanel } from "./FtoL3tCasePanel";
import { FtoL3tCatalogPanel } from "./FtoL3tCatalogPanel";
import {
  FTO_L3T_COUNTS,
  L3T_CATALOG,
  type FtoL3tCatalogCase,
} from "../lib/l3tCatalog";
import {
  exportFtoL3tStudy,
  gradeFtoL3tCase,
  importFtoL3tStudy,
  readFtoL3tStudy,
  readMasteredFtoL3tCaseKeys,
  writeFtoL3tStudy,
  writeMasteredFtoL3tCaseKeys,
} from "../lib/l3tStudy";

const STORE = {
  read: readFtoL3tStudy,
  write: writeFtoL3tStudy,
  readMasteredKeys: readMasteredFtoL3tCaseKeys,
  writeMasteredKeys: writeMasteredFtoL3tCaseKeys,
  grade: gradeFtoL3tCase,
  importStudy: importFtoL3tStudy,
};

export function FtoL3tStudyLab({
  language,
  onStatsChange,
}: {
  language: "vi" | "en";
  onStatsChange?: (stats: CaseStudyLaneStats) => void;
}) {
  const { t } = useLanguage();
  const catalog = useMemo(() => [...L3T_CATALOG], []);
  const lane = useCaseStudyLane<FtoL3tCatalogCase, ReturnType<typeof gradeFtoL3tCase>>({
    store: STORE,
    catalog,
    onStatsChange,
  });

  return (
    <CaseStudyLaneShell
      lane={lane}
      summary={t("l3t.laneSummary", { count: FTO_L3T_COUNTS.l3t })}
      backupFileName="cfop-fto-l3t-study-backup.json"
      exportBackup={() => exportFtoL3tStudy(lane.study, lane.masteredKeys)}
      casePanel={
        <FtoL3tCasePanel
          {...lane.casePanelProps}
          language={language}
        />
      }
      catalogPanel={
        <FtoL3tCatalogPanel {...lane.catalogPanelProps} />
      }
    />
  );
}
