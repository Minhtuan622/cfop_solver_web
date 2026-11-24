/**
 * 5×5 L2E practice card: the case preview (3D — the algorithms are aimed at
 * the "two unpaired edges" position on a normal 5×5), the recall drill and
 * the Again/Hard/Good/Easy self-grade. Mirrors the other lanes.
 */
import { fiveByFiveL2EScrambleOf } from "../lib/l2eAlg";
import {
  CasePracticeEmpty,
  CasePracticePanel,
  LazyPuzzlePreview,
  type CasePracticeProps,
} from "@/features/case-study";
import { useLanguage } from "@/contexts/LanguageContext";
import type { FiveByFiveL2ECatalogCase } from "../lib/l2eCatalog";

export type FiveByFiveL2ECasePanelProps = CasePracticeProps<FiveByFiveL2ECatalogCase> & {
  language: "vi" | "en";
};

export function FiveByFiveL2ECasePanel({ language, ...practice }: FiveByFiveL2ECasePanelProps) {
  const { t } = useLanguage();
  const { activeCase } = practice;
  if (!activeCase) return <CasePracticeEmpty />;

  return (
    <CasePracticePanel
      {...practice}
      activeCase={activeCase}
      caseLabel={t("l2e.caseLabel")}
      caseScramble={{ eventId: "555", scramble: fiveByFiveL2EScrambleOf(activeCase.algorithm) }}
      preview={
        <LazyPuzzlePreview
          eventId="555"
          puzzle="5x5x5"
          scramble={fiveByFiveL2EScrambleOf(activeCase.algorithm)}
          language={language}
          loadingLabel={t("l2e.loading3d")}
        />
      }
    />
  );
}
