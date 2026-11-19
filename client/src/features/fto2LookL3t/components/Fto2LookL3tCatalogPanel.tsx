/**
 * FTO 2-Look L3T catalog drawer: the shared CatalogExplorer wired to the
 * 2-Look L3T algorithms, grouped by family (PF / TCP A / TCP B / TCP C).
 * The case preview is the static diagram; the grid falls back to the
 * lane's octahedron emblem if a diagram is missing.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CatalogExplorer,
  type CatalogExplorerPreviewProps,
} from "@/features/last-layer/components/CatalogExplorer";
import { CaseDiagramImage } from "@/features/last-layer/components/CaseDiagramImage";
import type { Fto2LookL3tCatalogCase } from "../lib/l2tCatalog";

/** Flat octahedron mark (used when a case has no diagram). */
export function Fto2LookL3tMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      role="img"
      aria-hidden="true"
    >
      {/* octahedron silhouette: two pyramids base-to-base */}
      <polygon
        points="48,6 82,40 48,50 14,40"
        fill="#f5f5f0"
        stroke="#1f2937"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <polygon
        points="48,90 82,52 48,62 14,52"
        fill="#e9e9e4"
        stroke="#1f2937"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <polygon
        points="48,44 60,46 48,58 36,46"
        fill="#f2c144"
        stroke="#1f2937"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function L2tPreview(props: CatalogExplorerPreviewProps) {
  return (
    <CaseDiagramImage
      lane="fto2LookL3t"
      {...props}
      fallback={<Fto2LookL3tMark className="w-full max-w-none" />}
    />
  );
}

export function Fto2LookL3tCatalogPanel({
  cases,
  masteredKeys,
  activeCase,
  onSelect,
  onMasteredChange,
}: {
  cases: readonly Fto2LookL3tCatalogCase[];
  masteredKeys: Set<string>;
  activeCase: Fto2LookL3tCatalogCase | null;
  onSelect: (item: Fto2LookL3tCatalogCase) => void;
  onMasteredChange?: (keys: Set<string>) => void;
}) {
  const { t } = useLanguage();
  return (
    <CatalogExplorer
      catalog={cases}
      family="l3t2"
      familyOptions={null}
      selectedCase={activeCase}
      masteredKeys={masteredKeys}
      onFamily={() => undefined}
      onSelect={item => onSelect(item as Fto2LookL3tCatalogCase)}
      onMasteredChange={onMasteredChange}
      renderPreview={L2tPreview}
      catalogTitle={t("l2t.catalogTitle")}
      previewHint={t("study.previewHintL3T2")}
    />
  );
}
