/**
 * 4×4 Parity practice card: the case preview (3D — the parity algorithms are
 * long but the puzzle is a normal 4×4×4 for the player), the recall drill and
 * the Again/Hard/Good/Easy self-grade. Mirrors the other lanes.
 */
import { fourByFourParityScrambleOf } from "../lib/fourByFourParityAlg";
import {
  CasePracticeEmpty,
  CasePracticePanel,
  LazyPuzzlePreview,
  type CasePracticeProps,
} from "@/features/case-study";
import { useLanguage } from "@/contexts/LanguageContext";
import type { FourByFourParityCatalogCase } from "../lib/fourByFourParityCatalog";

export type FourByFourParityCasePanelProps = CasePracticeProps<FourByFourParityCatalogCase> & {
  language: "vi" | "en";
};

export function FourByFourParityCasePanel({ language, ...practice }: FourByFourParityCasePanelProps) {
  const { t } = useLanguage();
  const { activeCase } = practice;
  if (!activeCase) return <CasePracticeEmpty />;

  return (
    <CasePracticePanel
      {...practice}
      activeCase={activeCase}
      caseLabel={t("parity.caseLabel")}
      preview={
        <LazyPuzzlePreview
          eventId="444"
          puzzle="4x4x4"
          scramble={fourByFourParityScrambleOf(activeCase.algorithm)}
          language={language}
          loadingLabel={t("parity.loading3d")}
        />
      }
    />
  );
}
