/**
 * 4×4 Parity catalog drawer: the shared CatalogExplorer wired to the PLL
 * parity algorithms and a puzzle-shaped silhouette preview — the tile shows
 * a flat 4×4 grid mark; the preview dialog carries the group, the algorithm
 * and the practice card shows the real 3D case.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { useCallback, type KeyboardEvent } from "react";
import {
  CatalogExplorer,
  type CatalogExplorerPreviewProps,
} from "@/features/last-layer/components/CatalogExplorer";
import type { FourByFourParityCatalogCase } from "../lib/fourByFourParityCatalog";

/** Flat 4×4 grid mark (dark lines, white cells, yellow center pair). */
export function FourByFourMark({ className }: { className?: string }) {
  const cells: Array<{ x: number; y: number; fill: string }> = [];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const center = (row === 1 || row === 2) && (col === 1 || col === 2);
      cells.push({
        x: 8 + col * 20,
        y: 8 + row * 20,
        fill: center ? "#f2c144" : "#f5f5f0",
      });
    }
  }
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      role="img"
      aria-hidden="true"
    >
      {cells.map((cell, index) => (
        <rect
          key={index}
          x={cell.x}
          y={cell.y}
          width="20"
          height="20"
          fill={cell.fill}
          stroke="#1f2937"
          strokeWidth="3"
        />
      ))}
    </svg>
  );
}

function ParitySilhouettePreview({
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
      <FourByFourMark className="w-full max-w-none" />
    </div>
  );
}

export function FourByFourParityCatalogPanel({
  cases,
  masteredKeys,
  activeCase,
  onSelect,
  onMasteredChange,
}: {
  cases: readonly FourByFourParityCatalogCase[];
  masteredKeys: Set<string>;
  activeCase: FourByFourParityCatalogCase | null;
  onSelect: (item: FourByFourParityCatalogCase) => void;
  onMasteredChange?: (keys: Set<string>) => void;
}) {
  const { t } = useLanguage();
  return (
    <CatalogExplorer
      catalog={cases}
      family="pll-parity"
      familyOptions={null}
      selectedCase={activeCase}
      masteredKeys={masteredKeys}
      onFamily={() => undefined}
      onSelect={item => onSelect(item as FourByFourParityCatalogCase)}
      onMasteredChange={onMasteredChange}
      renderPreview={ParitySilhouettePreview}
      catalogTitle={t("parity.catalogTitle")}
      previewHint={t("study.previewHintParity")}
    />
  );
}
