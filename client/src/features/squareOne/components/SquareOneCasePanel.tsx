import { invertSquareOneAlgorithm } from "../lib/squareOneAlg";
import {
  CasePracticeEmpty,
  CasePracticePanel,
  LazyPuzzlePreview,
  type CasePracticeProps,
} from "@/features/case-study";
import { isSquareOneSetupLegal } from "@/lib/squareOneModel";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SquareOneCatalogCase } from "../lib/squareOneCatalog";

export type SquareOneCasePanelProps = CasePracticeProps<SquareOneCatalogCase> & {
  language: "vi" | "en";
};

export function SquareOneCasePanel({ language, ...practice }: SquareOneCasePanelProps) {
  const { t } = useLanguage();
  const { activeCase } = practice;
  if (!activeCase) return <CasePracticeEmpty />;
  const scramble = invertSquareOneAlgorithm(activeCase.algorithm);

  return (
    <CasePracticePanel
      {...practice}
      activeCase={activeCase}
      caseLabel={t("sq1.caseLabel")}
      caseScramble={{ eventId: "sq1", scramble }}
      preview={
        <LazyPuzzlePreview
          eventId="sq1"
          puzzle="square1"
          scramble={scramble}
          language={language}
          // A few cases start from a shifted layer and cannot be drawn on the
          // 3D model; they keep the flat diagram.
          model3d={isSquareOneSetupLegal(scramble)}
          loadingLabel={t("sq1.loading2d")}
          frameClassName="relative h-80 w-full overflow-hidden rounded-xl bg-surface-2"
        />
      }
    />
  );
}
