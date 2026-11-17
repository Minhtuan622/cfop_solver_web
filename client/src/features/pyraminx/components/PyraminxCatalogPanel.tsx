/**
 * Pyraminx catalog drawer: the shared CatalogExplorer wired to the Pyraminx
 * data and a puzzle-shaped silhouette preview — there is no 2D net for the
 * Pyraminx, so the tile shows a flat pyraminx mark and the enlarged preview
 * carries the algorithm. The practice card itself shows the live 3D case.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { useCallback, type KeyboardEvent } from "react";
import {
  CatalogExplorer,
  type CatalogExplorerPreviewProps,
} from "@/features/last-layer/components/CatalogExplorer";
import type { PyraminxCatalogCase } from "../lib/pyraminxCatalog";

/** Flat three-face pyraminx mark on the shared ink stage. */
export function PyraminxMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 84"
      className={className}
      role="img"
      aria-hidden="true"
    >
      <rect width="96" height="84" rx="14" fill="var(--cube-stage)" />
      <polygon points="48,12 27.5,45 68.5,45" fill="#ffd500" />
      <polygon points="6.5,76 29.2,42 48,76" fill="#009b48" />
      <polygon points="89.5,76 66.8,42 48,76" fill="#b71234" />
      <polygon points="27.5,45 68.5,45 48,76" fill="var(--cube-stage)" />
    </svg>
  );
}

function PyraminxSilhouettePreview({
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
      <PyraminxMark className="w-full max-w-none" />
    </div>
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
      renderPreview={PyraminxSilhouettePreview}
      catalogTitle={t("pyraminx.catalogTitle")}
      previewHint={t("study.previewHintPyraminx")}
    />
  );
}
