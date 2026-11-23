/**
 * The Skewb lane of /study: Sarah Intermediate (10 triggers: 1T · 2T · 3T)
 * and Sarah Advanced (93 cases, 16 subsets), with the same SRS practice loop
 * as the other lanes — time the recall, grade Again/Hard/Good/Easy, and let
 * the queue resurface weak cases.
 */
import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CaseStudyLaneShell,
  useCaseStudyLane,
  type CaseStudyLaneStats,
} from "@/features/case-study";
import { SkewbCasePanel } from "./SkewbCasePanel";
import { SkewbCatalogPanel } from "./SkewbCatalogPanel";
import {
  SKEWB_COUNTS,
  skewbCatalogOf,
  type SkewbCatalogCase,
  type SkewbFamily,
} from "../lib/skewbCatalog";
import {
  exportSkewbStudy,
  gradeSkewbCase,
  importSkewbStudy,
  readSkewbStudy,
  readMasteredSkewbCaseKeys,
  writeSkewbStudy,
  writeMasteredSkewbCaseKeys,
} from "../lib/skewbStudy";

const STORE = {
  read: readSkewbStudy,
  write: writeSkewbStudy,
  readMasteredKeys: readMasteredSkewbCaseKeys,
  writeMasteredKeys: writeMasteredSkewbCaseKeys,
  grade: gradeSkewbCase,
  importStudy: importSkewbStudy,
};

export function SkewbStudyLab({
  language,
  onStatsChange,
}: {
  language: "vi" | "en";
  /** Reports live SRS stats so the surrounding toolbar can show them. */
  onStatsChange?: (stats: CaseStudyLaneStats) => void;
}) {
  const { t } = useLanguage();
  const [family, setFamily] = useState<SkewbFamily>("sarah-intermediate");
  const catalog = useMemo(() => [...skewbCatalogOf(family)], [family]);
  const lane = useCaseStudyLane<SkewbCatalogCase, ReturnType<typeof gradeSkewbCase>>({
    store: STORE,
    catalog,
    family,
    onStatsChange,
  });

  return (
    <CaseStudyLaneShell
      lane={lane}
      setPicker={{
        label: t("skewb.setLabel"),
        options: [
          { value: "sarah-intermediate", label: t("skewb.setSarahIntermediate", { count: SKEWB_COUNTS["sarah-intermediate"] }) },
          { value: "sarah-advanced", label: t("skewb.setSarahAdvanced", { count: SKEWB_COUNTS["sarah-advanced"] }) },
        ],
        value: family,
        onChange: setFamily,
      }}
      summary={
        family === "sarah-intermediate"
          ? t("skewb.laneSummarySarahIntermediate", {
              count: SKEWB_COUNTS["sarah-intermediate"],
            })
          : t("skewb.laneSummarySarahAdvanced", {
              count: SKEWB_COUNTS["sarah-advanced"],
            })
      }
      backupFileName="cfop-skewb-study-backup.json"
      exportBackup={() => exportSkewbStudy(lane.study, lane.masteredKeys)}
      casePanel={
        <SkewbCasePanel
          {...lane.casePanelProps}
          language={language}
        />
      }
      catalogPanel={
        <SkewbCatalogPanel {...lane.catalogPanelProps} />
      }
    />
  );
}
