/**
 * Square-1 catalog drawer: the shared CatalogExplorer wired to the six
 * Square-1 sets and a puzzle-shaped silhouette preview — the tile shows a
 * flat Square-1 mark; the preview dialog carries the group, the algorithm
 * and the practice card shows the real 2D case. The parent already filters
 * by the active set (familyOptions=null); groups render one set at a time
 * because the subset names ("4 Slashes") repeat across sets.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { useCallback, type KeyboardEvent } from "react";
import {
  CatalogExplorer,
  type CatalogExplorerPreviewProps,
} from "@/features/last-layer/components/CatalogExplorer";
import type { SquareOneCatalogCase, SquareOneFamily } from "../lib/squareOneCatalog";

/** Flat Square-1 mark (white top / yellow bottom / grey equator belt). */
export function SquareOneMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      role="img"
      aria-hidden="true"
    >
      <circle cx="48" cy="48" r="38" fill="#f2c144" />
      <path d="M 10 48 A 38 38 0 0 1 86 48 Z" fill="#f5f5f0" />
      <rect x="8" y="42.5" width="80" height="11" fill="#8a8f9e" stroke="#1f2937" strokeWidth="3" />
      <circle cx="48" cy="48" r="38" fill="none" stroke="#1f2937" strokeWidth="5" />
    </svg>
  );
}

function SquareOneSilhouettePreview({
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
      style={{ width: "100%", maxWidth: compact ? "4rem" : "10rem" }}
    >
      <SquareOneMark className="w-full max-w-none" />
    </div>
  );
}

export function SquareOneCatalogPanel({
  cases,
  family,
  masteredKeys,
  activeCase,
  onSelect,
  onMasteredChange,
}: {
  cases: readonly SquareOneCatalogCase[];
  family: SquareOneFamily;
  masteredKeys: Set<string>;
  activeCase: SquareOneCatalogCase | null;
  onSelect: (item: SquareOneCatalogCase) => void;
  onMasteredChange?: (keys: Set<string>) => void;
}) {
  const { t } = useLanguage();
  return (
    <CatalogExplorer
      catalog={cases}
      family={family}
      familyOptions={null}
      selectedCase={activeCase}
      masteredKeys={masteredKeys}
      onFamily={() => undefined}
      onSelect={item => onSelect(item as SquareOneCatalogCase)}
      onMasteredChange={onMasteredChange}
      renderPreview={SquareOneSilhouettePreview}
      catalogTitle={t("sq1.catalogTitle")}
      previewHint={t("study.previewHintSq1")}
    />
  );
}
