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

/** Flat three-face pyraminx mark (yellow top · green left · red right). */
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
      style={{ width: "100%", maxWidth: compact ? "4rem" : "10rem" }}
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
