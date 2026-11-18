/**
 * Pyraminx catalog drawer: the shared CatalogExplorer wired to the Pyraminx
 * data and the extracted cubingapp.com case diagrams — there is no 2D net
 * for the Pyraminx, so the tiles show the same diagrams the site shows.
 * The practice card itself shows the live 3D case.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CatalogExplorer,
  type CatalogExplorerPreviewProps,
} from "@/features/last-layer/components/CatalogExplorer";
import { CaseDiagramImage } from "@/features/last-layer/components/CaseDiagramImage";
import type { PyraminxCatalogCase } from "../lib/pyraminxCatalog";

/** Flat three-face pyraminx mark (used when a case has no diagram). */
export function PyraminxMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 84"
      className={className}
      role="img"
      aria-hidden="true"
    >
      <polygon points="48,4 26,42 70,42" fill="#f2c144" />
      <polygon points="4,80 26,42 48,80" fill="#3aa655" />
      <polygon points="92,80 70,42 48,80" fill="#e0463a" />
      <polygon points="26,42 70,42 48,80" fill="#2b2b2b" />
      <polygon
        points="48,4 92,80 4,80"
        fill="none"
        stroke="#1f2937"
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PyraminxPreview(props: CatalogExplorerPreviewProps) {
  return (
    <CaseDiagramImage
      lane="pyraminx"
      {...props}
      fallback={<PyraminxMark className="w-full max-w-none" />}
    />
  );
}

export function PyraminxCatalogPanel({
  cases,
  masteredKeys,
  activeCase,
  onSelect,
  onMasteredChange,
}: {
  cases: readonly PyraminxCatalogCase[];
  masteredKeys: Set<string>;
  activeCase: PyraminxCatalogCase | null;
  onSelect: (item: PyraminxCatalogCase) => void;
  onMasteredChange?: (keys: Set<string>) => void;
}) {
  const { t } = useLanguage();
  return (
    <CatalogExplorer
      catalog={cases}
      family="all"
      familyOptions={null}
      selectedCase={activeCase}
      masteredKeys={masteredKeys}
      onFamily={() => undefined}
      onSelect={item => onSelect(item as PyraminxCatalogCase)}
      onMasteredChange={onMasteredChange}
      renderPreview={PyraminxPreview}
      catalogTitle={t("pyraminx.catalogTitle")}
      previewHint={t("study.previewHintPyraminx")}
    />
  );
}
