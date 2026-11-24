import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CaseStudyLaneShell,
  useCaseStudyLane,
  type CaseStudyLaneStats,
} from "@/features/case-study";
import { SquareOneCasePanel } from "./SquareOneCasePanel";
import { SquareOneCatalogPanel } from "./SquareOneCatalogPanel";
import {
  SQ1_COUNTS,
  squareOneCatalogOf,
  type SquareOneCatalogCase,
  type SquareOneFamily,
} from "../lib/squareOneCatalog";
import {
  exportSquareOneStudy,
  gradeSquareOneCase,
  importSquareOneStudy,
  readSquareOneStudy,
  readMasteredSquareOneCaseKeys,
  writeSquareOneStudy,
  writeMasteredSquareOneCaseKeys,
} from "../lib/squareOneStudy";

const STORE = {
  read: readSquareOneStudy,
  write: writeSquareOneStudy,
  readMasteredKeys: readMasteredSquareOneCaseKeys,
  writeMasteredKeys: writeMasteredSquareOneCaseKeys,
  grade: gradeSquareOneCase,
  importStudy: importSquareOneStudy,
};

export function SquareOneStudyLab({
  language,
  onStatsChange,
}: {
  language: "vi" | "en";
  onStatsChange?: (stats: CaseStudyLaneStats) => void;
}) {
  const { t } = useLanguage();
  const [family, setFamily] = useState<SquareOneFamily>("cs");
  const FAMILY_SUMMARIES: Record<SquareOneFamily, string> = {
    cp: t("sq1.laneSummaryCp", { count: SQ1_COUNTS.cp }),
    cs: t("sq1.laneSummaryCs", { count: SQ1_COUNTS.cs }),
    csp: t("sq1.laneSummaryCsp", { count: SQ1_COUNTS.csp }),
    eo: t("sq1.laneSummaryEo", { count: SQ1_COUNTS.eo }),
    ep: t("sq1.laneSummaryEp", { count: SQ1_COUNTS.ep }),
    obl: t("sq1.laneSummaryObl", { count: SQ1_COUNTS.obl }),
  };
  const catalog = useMemo(() => [...squareOneCatalogOf(family)], [family]);
  const lane = useCaseStudyLane<SquareOneCatalogCase, ReturnType<typeof gradeSquareOneCase>>({
    store: STORE,
    catalog,
    family,
    onStatsChange,
  });

  return (
    <CaseStudyLaneShell
      lane={lane}
      setPicker={{
        label: t("sq1.setLabel"),
        options: [
          { value: "cp", label: t("sq1.setCp", { count: SQ1_COUNTS.cp }) },
          { value: "cs", label: t("sq1.setCs", { count: SQ1_COUNTS.cs }) },
          { value: "csp", label: t("sq1.setCsp", { count: SQ1_COUNTS.csp }) },
          { value: "eo", label: t("sq1.setEo", { count: SQ1_COUNTS.eo }) },
          { value: "ep", label: t("sq1.setEp", { count: SQ1_COUNTS.ep }) },
          { value: "obl", label: t("sq1.setObl", { count: SQ1_COUNTS.obl }) },
        ],
        value: family,
        onChange: setFamily,
      }}
      summary={FAMILY_SUMMARIES[family]}
      backupFileName="cfop-sq1-study-backup.json"
      exportBackup={() => exportSquareOneStudy(lane.study, lane.masteredKeys)}
      casePanel={
        <SquareOneCasePanel
          {...lane.casePanelProps}
          language={language}
        />
      }
      catalogPanel={
        <SquareOneCatalogPanel {...lane.catalogPanelProps} family={family} />
      }
    />
  );
}
