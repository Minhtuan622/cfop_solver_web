import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CaseStudyLaneShell,
  useCaseStudyLane,
  type CaseStudyLaneStats,
} from "@/features/case-study";
import { FourByFourParityCasePanel } from "./FourByFourParityCasePanel";
import { FourByFourParityCatalogPanel } from "./FourByFourParityCatalogPanel";
import {
  FOUR_BY_FOUR_PARITY_COUNTS,
  PARITY_CATALOG,
  type FourByFourParityCatalogCase,
} from "../lib/fourByFourParityCatalog";
import {
  exportFourByFourParityStudy,
  gradeFourByFourParityCase,
  importFourByFourParityStudy,
  readFourByFourParityStudy,
  readMasteredFourByFourParityCaseKeys,
  writeFourByFourParityStudy,
  writeMasteredFourByFourParityCaseKeys,
} from "../lib/fourByFourParityStudy";

const STORE = {
  read: readFourByFourParityStudy,
  write: writeFourByFourParityStudy,
  readMasteredKeys: readMasteredFourByFourParityCaseKeys,
  writeMasteredKeys: writeMasteredFourByFourParityCaseKeys,
  grade: gradeFourByFourParityCase,
  importStudy: importFourByFourParityStudy,
};

export function FourByFourParityStudyLab({
  language,
  onStatsChange,
}: {
  language: "vi" | "en";
  onStatsChange?: (stats: CaseStudyLaneStats) => void;
}) {
  const { t } = useLanguage();
  const catalog = useMemo(() => [...PARITY_CATALOG], []);
  const lane = useCaseStudyLane<FourByFourParityCatalogCase, ReturnType<typeof gradeFourByFourParityCase>>({
    store: STORE,
    catalog,
    onStatsChange,
  });

  return (
    <CaseStudyLaneShell
      lane={lane}
      summary={t("parity.laneSummary", { count: FOUR_BY_FOUR_PARITY_COUNTS["pll-parity"] })}
      backupFileName="cfop-4x4parity-study-backup.json"
      exportBackup={() => exportFourByFourParityStudy(lane.study, lane.masteredKeys)}
      casePanel={
        <FourByFourParityCasePanel
          {...lane.casePanelProps}
          language={language}
        />
      }
      catalogPanel={
        <FourByFourParityCatalogPanel {...lane.catalogPanelProps} />
      }
    />
  );
}
