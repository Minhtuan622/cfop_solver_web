/**
 * The 2×2 CLL lane of /study: 40 cases across Antisune, H, L, Pi, Sune, T and
 * U subsets, with the same SRS practice loop as the other lanes — time the
 * recall, grade Again/Hard/Good/Easy, and let the queue resurface weak cases.
 */
import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CaseStudyLaneShell,
  useCaseStudyLane,
  type CaseStudyLaneStats,
} from "@/features/case-study";
import { TwoByTwoCasePanel } from "./TwoByTwoCasePanel";
import { TwoByTwoCatalogPanel } from "./TwoByTwoCatalogPanel";
import {
  TWO_BY_TWO_COUNTS,
  twoByTwoCatalogOf,
  type TwoByTwoCatalogCase,
  type TwoByTwoFamily,
} from "../lib/twoByTwoCatalog";
import {
  exportTwoByTwoStudy,
  gradeTwoByTwoCase,
  importTwoByTwoStudy,
  readTwoByTwoStudy,
  readMasteredTwoByTwoCaseKeys,
  writeTwoByTwoStudy,
  writeMasteredTwoByTwoCaseKeys,
} from "../lib/twoByTwoStudy";

const STORE = {
  read: readTwoByTwoStudy,
  write: writeTwoByTwoStudy,
  readMasteredKeys: readMasteredTwoByTwoCaseKeys,
  writeMasteredKeys: writeMasteredTwoByTwoCaseKeys,
  grade: gradeTwoByTwoCase,
  importStudy: importTwoByTwoStudy,
};

export function TwoByTwoStudyLab({
  language,
  onStatsChange,
}: {
  language: "vi" | "en";
  /** Reports live SRS stats so the surrounding toolbar can show them. */
  onStatsChange?: (stats: CaseStudyLaneStats) => void;
}) {
  const { t } = useLanguage();
  const [family, setFamily] = useState<TwoByTwoFamily>("cll");
  const [caseView, setCaseView] = useState<"2d" | "3d">("2d");
  const catalog = useMemo(() => [...twoByTwoCatalogOf(family)], [family]);
  const lane = useCaseStudyLane<TwoByTwoCatalogCase, ReturnType<typeof gradeTwoByTwoCase>>({
    store: STORE,
    catalog,
    family,
    onStatsChange,
  });

  return (
    <CaseStudyLaneShell
      lane={lane}
      setPicker={{
        label: t("twoByTwo.setLabel"),
        options: [
          { value: "cll", label: t("twoByTwo.setCll", { count: TWO_BY_TWO_COUNTS.cll }) },
          { value: "pbl", label: t("twoByTwo.setPbl", { count: TWO_BY_TWO_COUNTS.pbl }) },
          { value: "eg1", label: t("twoByTwo.setEg1", { count: TWO_BY_TWO_COUNTS.eg1 }) },
          { value: "eg2", label: t("twoByTwo.setEg2", { count: TWO_BY_TWO_COUNTS.eg2 }) },
        ],
        value: family,
        onChange: setFamily,
      }}
      summary={
        family === "cll"
          ? t("twoByTwo.laneSummaryCll", { count: TWO_BY_TWO_COUNTS.cll })
          : family === "pbl"
            ? t("twoByTwo.laneSummaryPbl", { count: TWO_BY_TWO_COUNTS.pbl })
            : family === "eg1"
              ? t("twoByTwo.laneSummaryEg1", { count: TWO_BY_TWO_COUNTS.eg1 })
              : t("twoByTwo.laneSummaryEg2", { count: TWO_BY_TWO_COUNTS.eg2 })
      }
      backupFileName="cfop-twobytwo-study-backup.json"
      exportBackup={() => exportTwoByTwoStudy(lane.study, lane.masteredKeys)}
      casePanel={
        <TwoByTwoCasePanel
          {...lane.casePanelProps}
          view={caseView}
          onViewChange={setCaseView}
          language={language}
        />
      }
      catalogPanel={
        <TwoByTwoCatalogPanel {...lane.catalogPanelProps} />
      }
    />
  );
}
