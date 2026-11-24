/**
 * Roux practice card: the 3D case preview, the recall drill and the
 * Again/Hard/Good/Easy self-grade. Mirrors the Skewb case panel.
 */
import { invertAlgorithm } from "@/lib/fastCube";
import {
  CasePracticeEmpty,
  CasePracticePanel,
  LazyPuzzlePreview,
  type CasePracticeProps,
} from "@/features/case-study";
import { useLanguage } from "@/contexts/LanguageContext";
import type { RouxCatalogCase } from "../lib/rouxCatalog";

export type RouxCasePanelProps = CasePracticeProps<RouxCatalogCase> & {
  language: "vi" | "en";
};

export function RouxCasePanel({ language, ...practice }: RouxCasePanelProps) {
  const { t } = useLanguage();
  const { activeCase } = practice;
  if (!activeCase) return <CasePracticeEmpty />;

  return (
    <CasePracticePanel
      {...practice}
      activeCase={activeCase}
      caseLabel={t("roux.caseLabel")}
      preview={
        <LazyPuzzlePreview
          eventId="333"
          puzzle="3x3x3"
          scramble={invertAlgorithm(activeCase.algorithm)}
          language={language}
          loadingLabel={t("roux.loading3d")}
        />
      }
    />
  );
}
