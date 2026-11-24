import { CaseDiagramImage } from "@/features/last-layer/components/CaseDiagramImage";
import {
  CasePracticeEmpty,
  CasePracticePanel,
  type CasePracticeProps,
} from "@/features/case-study";
import { useLanguage } from "@/contexts/LanguageContext";
import { FtoL3tMark } from "./FtoL3tCatalogPanel";
import type { FtoL3tCatalogCase } from "../lib/l3tCatalog";

export type FtoL3tCasePanelProps = CasePracticeProps<FtoL3tCatalogCase> & {
  language: "vi" | "en";
};

export function FtoL3tCasePanel({ language: _language, ...practice }: FtoL3tCasePanelProps) {
  const { t } = useLanguage();
  const { activeCase } = practice;
  if (!activeCase) return <CasePracticeEmpty />;

  return (
    <CasePracticePanel
      {...practice}
      activeCase={activeCase}
      caseLabel={t("l3t.caseLabel")}
      preview={
        <div className="relative flex items-center justify-center overflow-hidden rounded-xl bg-surface-2 p-4">
          <CaseDiagramImage
            lane="ftoL3t"
            state={activeCase.state}
            label={activeCase.id}
            fallback={<FtoL3tMark className="w-40 max-w-full" />}
          />
        </div>
      }
      previewFooter={
        <>
          <p className="mt-2 text-center text-xs text-muted">
            {t("l3t.gripHint")}
          </p>
          <p className="mt-1 text-center text-[11px] text-muted/70">
            Sơ đồ:{" "}
            <a
              href="https://cuberoot.me/alg/fto"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-ink"
            >
              CubeRoot
            </a>
          </p>
        </>
      }
    />
  );
}
