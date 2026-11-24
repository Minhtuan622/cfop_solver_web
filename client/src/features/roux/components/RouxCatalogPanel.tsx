import { useLanguage } from "@/contexts/LanguageContext";
import {
  CatalogExplorer,
  type CatalogExplorerPreviewProps,
} from "@/features/last-layer/components/CatalogExplorer";
import type { RouxCatalogCase } from "../lib/rouxCatalog";
import { RouxTopView } from "./RouxTopView";

export function RouxMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-hidden="true">
      <rect x="8" y="8" width="24" height="80" rx="4" fill="#5eead4" />
      <rect x="64" y="8" width="24" height="80" rx="4" fill="#5eead4" />
      <rect x="36" y="8" width="24" height="80" rx="4" fill="#f2c144" />
      <rect
        x="8"
        y="8"
        width="80"
        height="80"
        rx="6"
        fill="none"
        stroke="#1f2937"
        strokeWidth="5"
      />
    </svg>
  );
}

function RouxPreview({ algorithm, label }: CatalogExplorerPreviewProps) {
  const mark = <RouxMark className="w-full max-w-none" />;
  return algorithm ? (
    <RouxTopView algorithm={algorithm} label={label} fallback={mark} />
  ) : (
    mark
  );
}

export function RouxCatalogPanel({
  cases,
  masteredKeys,
  activeCase,
  onSelect,
  onMasteredChange,
}: {
  cases: readonly RouxCatalogCase[];
  masteredKeys: Set<string>;
  activeCase: RouxCatalogCase | null;
  onSelect: (item: RouxCatalogCase) => void;
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
      onSelect={item => onSelect(item as RouxCatalogCase)}
      onMasteredChange={onMasteredChange}
      renderPreview={RouxPreview}
      focusStorageKey="roux"
      catalogTitle={t("roux.catalogTitle")}
      previewHint={t("roux.previewHint")}
    />
  );
}
