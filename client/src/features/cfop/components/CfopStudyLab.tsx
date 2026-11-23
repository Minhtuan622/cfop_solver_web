/**
 * The CFOP lane of /study: F2L, OLL and PLL cases with the same SRS practice
 * loop as the Last Layer lane — time yourself on a case, grade Again/Hard/
 * Good/Easy, and let the queue re-surface the ones you keep missing.
 */
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CaseStudyLaneShell,
  useCaseStudyLane,
  type CaseStudyLaneStats,
} from "@/features/case-study";
import { StudyCasePanel } from "@/features/last-layer/components/StudyCasePanel";
import { CfopCatalogPanel } from "./CfopCatalogPanel";
import {
  CFOP_CATALOG,
  CFOP_COUNTS,
  type CfopCatalogCase,
} from "../lib/cfopCatalog";
import {
  exportCfopStudy,
  gradeCfopCase,
  importCfopStudy,
  readCfopStudy,
  readMasteredCfopCaseKeys,
  writeCfopStudy,
  writeMasteredCfopCaseKeys,
} from "../lib/cfopStudy";

const STORE = {
  read: readCfopStudy,
  write: writeCfopStudy,
  readMasteredKeys: readMasteredCfopCaseKeys,
  writeMasteredKeys: writeMasteredCfopCaseKeys,
  grade: gradeCfopCase,
  importStudy: importCfopStudy,
};

const CATALOG: CfopCatalogCase[] = [...CFOP_CATALOG];

export function CfopStudyLab({
  language,
  onStatsChange,
}: {
  language: "vi" | "en";
  /** Reports live SRS stats so the surrounding toolbar can show them. */
  onStatsChange?: (stats: CaseStudyLaneStats) => void;
}) {
  const { t } = useLanguage();
  const [caseView, setCaseView] = useState<"2d" | "3d">("2d");
  const catalog = CATALOG;
  const lane = useCaseStudyLane<CfopCatalogCase, ReturnType<typeof gradeCfopCase>>({
    store: STORE,
    catalog,
    onStatsChange,
  });

  return (
    <CaseStudyLaneShell
      lane={lane}
      summary={t("cfop.laneSummary", {
        f2l: CFOP_COUNTS.f2l,
        oll: CFOP_COUNTS.oll,
        pll: CFOP_COUNTS.pll,
        coll: CFOP_COUNTS.coll,
        ollcp: CFOP_COUNTS.ollcp,
      })}
      backupFileName="cfop-cfop-study-backup.json"
      exportBackup={() => exportCfopStudy(lane.study, lane.masteredKeys)}
      casePanel={
        <StudyCasePanel
          {...lane.casePanelProps}
          loading={false}
          view={caseView}
          onViewChange={setCaseView}
        />
      }
      catalogPanel={
        <CfopCatalogPanel {...lane.catalogPanelProps} />
      }
    />
  );
}
