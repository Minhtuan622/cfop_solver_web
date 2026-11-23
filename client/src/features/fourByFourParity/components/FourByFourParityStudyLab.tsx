/**
 * The 4×4 Parity lane of /study: the PLL parity algorithms (22 cases) with
 * the same SRS practice loop as the other lanes — time the recall, grade
 * Again/Hard/Good/Easy, and let the queue resurface weak cases.
 */
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
  /** Reports live SRS stats so the surrounding toolbar can show them. */
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
