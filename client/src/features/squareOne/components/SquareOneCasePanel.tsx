import { invertSquareOneAlgorithm } from "../lib/squareOneAlg";
import {
  CasePracticeEmpty,
  CasePracticePanel,
  LazyPuzzlePreview,
  type CasePracticeProps,
} from "@/features/case-study";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SquareOneCatalogCase } from "../lib/squareOneCatalog";

export type SquareOneCasePanelProps = CasePracticeProps<SquareOneCatalogCase> & {
  language: "vi" | "en";
};

export function SquareOneCasePanel({ language, ...practice }: SquareOneCasePanelProps) {
  const { t } = useLanguage();
  const { activeCase } = practice;
  if (!activeCase) return <CasePracticeEmpty />;

  return (
    <CasePracticePanel
      {...practice}
      activeCase={activeCase}
      caseLabel={t("sq1.caseLabel")}
      caseScramble={{ eventId: "sq1", scramble: invertSquareOneAlgorithm(activeCase.algorithm) }}
      preview={
        <LazyPuzzlePreview
          eventId="sq1"
          puzzle="square1"
          scramble={invertSquareOneAlgorithm(activeCase.algorithm)}
          language={language}
          loadingLabel={t("sq1.loading2d")}
          frameClassName="relative h-80 w-full overflow-hidden rounded-xl bg-surface-2"
        />
      }
    />
  );
}
