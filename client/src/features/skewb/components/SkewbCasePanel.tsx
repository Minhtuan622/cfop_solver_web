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
      caseScramble={{ eventId: "skewb", scramble: invertAlgorithm(activeCase.algorithm) }}
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
