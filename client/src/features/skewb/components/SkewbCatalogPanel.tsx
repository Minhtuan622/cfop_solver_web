/**
 * Skewb catalog drawer: the shared CatalogExplorer wired to the Sarah
 * Intermediate/Advanced data and a puzzle-shaped silhouette preview — there
 * is no 2D net for the Skewb, so the tile shows a flat skewb mark and the
 * enlarged preview carries the algorithm. The practice card itself shows the
 * live 3D case.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { useCallback, type KeyboardEvent } from "react";
import {
  CatalogExplorer,
  type CatalogExplorerPreviewProps,
} from "@/features/last-layer/components/CatalogExplorer";
import type { SkewbCatalogCase } from "../lib/skewbCatalog";

/** Flat skewb mark on the shared ink stage (diagonals, yellow top/bottom). */
export function SkewbMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      role="img"
      aria-hidden="true"
    >
      <rect width="96" height="96" rx="16" fill="var(--cube-stage)" />
      <polygon points="10,10 86,10 48,46" fill="#ffd500" />
      <polygon points="10,86 86,86 48,50" fill="#ffd500" />
      <polygon points="10,10 10,86 45,48" fill="#f2f2f2" />
      <polygon points="86,10 86,86 51,48" fill="#f2f2f2" />
    </svg>
  );
}

function SkewbSilhouettePreview({
  label,
  compact = false,
  onClick,
}: CatalogExplorerPreviewProps) {
  const { t } = useLanguage();
  const interactive = Boolean(onClick);
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!onClick || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      onClick();
    },
    [onClick]
  );
  return (
    <div
      aria-label={t("study.previewOf", { label })}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      title={interactive ? t("study.enlargePreview", { label }) : undefined}
      className={interactive ? "w-full cursor-pointer" : "w-full"}
      style={{ width: "100%", maxWidth: compact ? "6rem" : "min(12rem, 100%)" }}
    >
      <SkewbMark className="w-full max-w-none" />
    </div>
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
      renderPreview={SkewbSilhouettePreview}
      catalogTitle={t("skewb.catalogTitle")}
      previewHint={t("study.previewHintSkewb")}
    />
  );
}
