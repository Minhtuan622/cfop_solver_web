/**
 * The Roux lane of /study: all 42 CMLL cases and the LSE steps (EO, UL/UR,
 * L4E), with the same SRS practice loop as the other lanes — time the recall,
 * grade Again/Hard/Good/Easy, and let the queue resurface weak cases.
 */
import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CaseStudyLaneShell,
  useCaseStudyLane,
  type CaseStudyLaneStats,
} from "@/features/case-study";
import { RouxCasePanel } from "./RouxCasePanel";
import { RouxCatalogPanel } from "./RouxCatalogPanel";
import {
  ROUX_COUNTS,
  rouxCatalogOf,
  type RouxCatalogCase,
  type RouxFamily,
} from "../lib/rouxCatalog";
import {
  exportRouxStudy,
  gradeRouxCase,
  importRouxStudy,
  readRouxStudy,
  readMasteredRouxCaseKeys,
  writeRouxStudy,
  writeMasteredRouxCaseKeys,
} from "../lib/rouxStudy";

const STORE = {
  read: readRouxStudy,
  write: writeRouxStudy,
  readMasteredKeys: readMasteredRouxCaseKeys,
  writeMasteredKeys: writeMasteredRouxCaseKeys,
  grade: gradeRouxCase,
  importStudy: importRouxStudy,
};

export function RouxStudyLab({
  language,
  onStatsChange,
}: {
  language: "vi" | "en";
  /** Reports live SRS stats so the surrounding toolbar can show them. */
  onStatsChange?: (stats: CaseStudyLaneStats) => void;
}) {
  const { t } = useLanguage();
  const [family, setFamily] = useState<RouxFamily>("cmll");
  const catalog = useMemo(() => [...rouxCatalogOf(family)], [family]);
  const lane = useCaseStudyLane<RouxCatalogCase, ReturnType<typeof gradeRouxCase>>({
    store: STORE,
    catalog,
    family,
    onStatsChange,
  });

  return (
    <CaseStudyLaneShell
      lane={lane}
      setPicker={{
        label: t("roux.setLabel"),
        options: [
          { value: "cmll", label: t("roux.setCmll", { count: ROUX_COUNTS.cmll }) },
          { value: "lse", label: t("roux.setLse", { count: ROUX_COUNTS.lse }) },
        ],
        value: family,
        onChange: setFamily,
      }}
      summary={
        family === "cmll"
          ? t("roux.laneSummaryCmll", { count: ROUX_COUNTS.cmll })
          : t("roux.laneSummaryLse", { count: ROUX_COUNTS.lse })
      }
      backupFileName="cfop-roux-study-backup.json"
      exportBackup={() => exportRouxStudy(lane.study, lane.masteredKeys)}
      casePanel={<RouxCasePanel {...lane.casePanelProps} language={language} />}
      catalogPanel={<RouxCatalogPanel {...lane.catalogPanelProps} />}
    />
  );
}
