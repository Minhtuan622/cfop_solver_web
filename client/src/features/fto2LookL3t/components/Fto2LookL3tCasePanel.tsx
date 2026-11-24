import { CaseDiagramImage } from "@/features/last-layer/components/CaseDiagramImage";
import {
  CasePracticeEmpty,
  CasePracticePanel,
  type CasePracticeProps,
} from "@/features/case-study";
import { useLanguage } from "@/contexts/LanguageContext";
import { Fto2LookL3tMark } from "./Fto2LookL3tCatalogPanel";
import type { Fto2LookL3tCatalogCase } from "../lib/l2tCatalog";

export type Fto2LookL3tCasePanelProps = CasePracticeProps<Fto2LookL3tCatalogCase> & {
  language: "vi" | "en";
};

export function Fto2LookL3tCasePanel({ language: _language, ...practice }: Fto2LookL3tCasePanelProps) {
  const { t } = useLanguage();
  const { activeCase } = practice;
  if (!activeCase) return <CasePracticeEmpty />;

  return (
    <CasePracticePanel
      {...practice}
      activeCase={activeCase}
      caseLabel={t("l2t.caseLabel")}
      preview={
        <div className="relative flex items-center justify-center overflow-hidden rounded-xl bg-surface-2 p-4">
          <CaseDiagramImage
            lane="fto2LookL3t"
            state={activeCase.state}
            label={activeCase.id}
            fallback={<Fto2LookL3tMark className="w-40 max-w-full" />}
          />
        </div>
      }
      previewFooter={
        <>
          <p className="mt-2 text-center text-xs text-muted">
            {t("l2t.gripHint")}
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
            </a>{" "}
            · Biến thể (2):{" "}
            <a
              href="https://hcubist.com/learn/algorithms/fto-2-look-l3t"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-ink"
            >
              HCubist
            </a>
          </p>
        </>
      }
    />
  );
}
