import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CaseStudyLaneShell,
  useCaseStudyLane,
  type CaseStudyLaneStats,
} from "@/features/case-study";
import { Fto2LookL3tCasePanel } from "./Fto2LookL3tCasePanel";
import { Fto2LookL3tCatalogPanel } from "./Fto2LookL3tCatalogPanel";
import {
  FTO_2_LOOK_L3T_COUNTS,
  L2T_CATALOG,
  type Fto2LookL3tCatalogCase,
} from "../lib/l2tCatalog";
import {
  exportFto2LookL3tStudy,
  gradeFto2LookL3tCase,
  importFto2LookL3tStudy,
  readFto2LookL3tStudy,
  readMasteredFto2LookL3tCaseKeys,
  writeFto2LookL3tStudy,
  writeMasteredFto2LookL3tCaseKeys,
} from "../lib/l2tStudy";

const STORE = {
  read: readFto2LookL3tStudy,
  write: writeFto2LookL3tStudy,
  readMasteredKeys: readMasteredFto2LookL3tCaseKeys,
  writeMasteredKeys: writeMasteredFto2LookL3tCaseKeys,
  grade: gradeFto2LookL3tCase,
  importStudy: importFto2LookL3tStudy,
};

export function Fto2LookL3tStudyLab({
  language,
  onStatsChange,
}: {
  language: "vi" | "en";
  onStatsChange?: (stats: CaseStudyLaneStats) => void;
}) {
  const { t } = useLanguage();
  const catalog = useMemo(() => [...L2T_CATALOG], []);
  const lane = useCaseStudyLane<Fto2LookL3tCatalogCase, ReturnType<typeof gradeFto2LookL3tCase>>({
    store: STORE,
    catalog,
    onStatsChange,
  });

  return (
    <CaseStudyLaneShell
      lane={lane}
      summary={t("l2t.laneSummary", { count: FTO_2_LOOK_L3T_COUNTS.l3t2 })}
      backupFileName="cfop-fto-2-look-l3t-study-backup.json"
      exportBackup={() => exportFto2LookL3tStudy(lane.study, lane.masteredKeys)}
      casePanel={
        <Fto2LookL3tCasePanel
          {...lane.casePanelProps}
          language={language}
        />
      }
      catalogPanel={
        <Fto2LookL3tCatalogPanel {...lane.catalogPanelProps} />
      }
    />
  );
}
