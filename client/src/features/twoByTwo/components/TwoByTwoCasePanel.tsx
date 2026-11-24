import { CubeNet2x2 } from "./CubeNet2x2";
import { invertAlgorithm } from "@/lib/fastCube";
import {
  CasePracticeEmpty,
  CasePracticePanel,
  LazyPuzzlePreview,
  type CasePracticeProps,
} from "@/features/case-study";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";
import type { TwoByTwoCatalogCase } from "../lib/twoByTwoCatalog";

export type TwoByTwoCasePanelProps = CasePracticeProps<TwoByTwoCatalogCase> & {
  view: "2d" | "3d";
  onViewChange: (view: "2d" | "3d") => void;
  language: "vi" | "en";
};

export function TwoByTwoCasePanel({
  view,
  onViewChange,
  language,
  ...practice
}: TwoByTwoCasePanelProps) {
  const { t } = useLanguage();
  const { activeCase } = practice;
  if (!activeCase) return <CasePracticeEmpty />;

  return (
    <CasePracticePanel
      {...practice}
      activeCase={activeCase}
      caseLabel={t("twoByTwo.caseLabel")}
      caseScramble={{ eventId: "222", scramble: invertAlgorithm(activeCase.algorithm) }}
      toolbarStart={
        <div
          className="inline-flex flex-wrap items-center gap-1 text-xs"
          role="group"
          aria-label={t("study.viewLabel")}
        >
          <Button
            type="button"
            variant={view === "2d" ? "primary" : "secondary"}
            size="plain"
            className="px-4 py-2 text-sm"
            aria-pressed={view === "2d"}
            onClick={() => onViewChange("2d")}
          >
            2D
          </Button>
          <Button
            type="button"
            variant={view === "3d" ? "primary" : "secondary"}
            size="plain"
            className="px-4 py-2 text-sm"
            aria-pressed={view === "3d"}
            onClick={() => onViewChange("3d")}
          >
            3D
          </Button>
        </div>
      }
      preview={
        view === "2d" ? (
          <div className="rounded-xl bg-surface-2 p-4 text-center">
            <CubeNet2x2 state={activeCase.state} />
          </div>
        ) : (
          <LazyPuzzlePreview
            eventId="222"
            puzzle="2x2x2"
            scramble={invertAlgorithm(activeCase.algorithm)}
            language={language}
            loadingLabel={t("twoByTwo.loading3d")}
          />
        )
      }
    />
  );
}
