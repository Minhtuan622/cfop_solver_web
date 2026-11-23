/**
 * Skewb practice card: the case preview (3D-only — the Skewb has no
 * 2D net in this app), the recall drill and the Again/Hard/Good/Easy
 * self-grade. Mirrors the Pyraminx case panel.
 */
import { invertAlgorithm } from "@/lib/fastCube";
import {
  CasePracticeEmpty,
  CasePracticePanel,
  LazyPuzzlePreview,
  type CasePracticeProps,
} from "@/features/case-study";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SkewbCatalogCase } from "../lib/skewbCatalog";

export type SkewbCasePanelProps = CasePracticeProps<SkewbCatalogCase> & {
  language: "vi" | "en";
};

export function SkewbCasePanel({ language, ...practice }: SkewbCasePanelProps) {
  const { t } = useLanguage();
  const { activeCase } = practice;
  if (!activeCase) return <CasePracticeEmpty />;

  return (
    <CasePracticePanel
      {...practice}
      activeCase={activeCase}
      caseLabel={t("skewb.caseLabel")}
      preview={
        <LazyPuzzlePreview
          eventId="skewb"
          puzzle="skewb"
          scramble={invertAlgorithm(activeCase.algorithm)}
          language={language}
          loadingLabel={t("skewb.loading3d")}
        />
      }
    />
  );
}
