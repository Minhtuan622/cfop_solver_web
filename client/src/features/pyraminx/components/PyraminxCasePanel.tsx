/**
 * Pyraminx practice card: the case preview (3D-only — the Pyraminx has no
 * 2D net in this app), the recall drill and the Again/Hard/Good/Easy
 * self-grade. Mirrors TwoByTwoCasePanel.
 */
import { invertPyraminxAlgorithm } from "../lib/pyraminxAlg";
import {
  CasePracticeEmpty,
  CasePracticePanel,
  LazyPuzzlePreview,
  type CasePracticeProps,
} from "@/features/case-study";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PyraminxCatalogCase } from "../lib/pyraminxCatalog";

export type PyraminxCasePanelProps = CasePracticeProps<PyraminxCatalogCase> & {
  language: "vi" | "en";
};

export function PyraminxCasePanel({ language, ...practice }: PyraminxCasePanelProps) {
  const { t } = useLanguage();
  const { activeCase } = practice;
  if (!activeCase) return <CasePracticeEmpty />;

  return (
    <CasePracticePanel
      {...practice}
      activeCase={activeCase}
      caseLabel={t("pyraminx.caseLabel")}
      preview={
        <LazyPuzzlePreview
          eventId="pyram"
          puzzle="pyraminx"
          scramble={invertPyraminxAlgorithm(activeCase.algorithm)}
          language={language}
          loadingLabel={t("pyraminx.loading3d")}
        />
      }
    />
  );
}
