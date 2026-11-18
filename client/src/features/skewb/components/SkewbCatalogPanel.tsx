/**
 * Skewb catalog drawer: the shared CatalogExplorer wired to the Sarah
 * Intermediate/Advanced data and the extracted cubingapp.com case diagrams.
 * The practice card itself shows the live 3D case.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CatalogExplorer,
  type CatalogExplorerPreviewProps,
} from "@/features/last-layer/components/CatalogExplorer";
import { CaseDiagramImage } from "@/features/last-layer/components/CaseDiagramImage";
import type { SkewbCatalogCase } from "../lib/skewbCatalog";

/** Flat skewb mark (used when a case has no diagram). */
export function SkewbMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      role="img"
      aria-hidden="true"
    >
      <polygon points="8,8 88,8 48,48" fill="#f2c144" />
      <polygon points="8,88 88,88 48,48" fill="#f2c144" />
      <polygon points="8,8 8,88 48,48" fill="#f5f5f0" />
      <polygon points="88,8 88,88 48,48" fill="#f5f5f0" />
      <rect
        x="8"
        y="8"
        width="80"
        height="80"
        fill="none"
        stroke="#1f2937"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <line x1="8" y1="8" x2="88" y2="88" stroke="#1f2937" strokeWidth="4" />
      <line x1="88" y1="8" x2="8" y2="88" stroke="#1f2937" strokeWidth="4" />
      <polygon points="48,40 56,48 48,56 40,48" fill="#1f2937" />
    </svg>
  );
}

function SkewbPreview(props: CatalogExplorerPreviewProps) {
  return (
    <CaseDiagramImage
      lane="skewb"
      {...props}
      fallback={<SkewbMark className="w-full max-w-none" />}
    />
  );
}

export function SkewbCatalogPanel({
  cases,
  masteredKeys,
  activeCase,
  onSelect,
  onMasteredChange,
}: {
  cases: readonly SkewbCatalogCase[];
  masteredKeys: Set<string>;
  activeCase: SkewbCatalogCase | null;
  onSelect: (item: SkewbCatalogCase) => void;
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
      onSelect={item => onSelect(item as SkewbCatalogCase)}
      onMasteredChange={onMasteredChange}
      renderPreview={SkewbPreview}
      catalogTitle={t("skewb.catalogTitle")}
      previewHint={t("study.previewHintSkewb")}
    />
  );
}
