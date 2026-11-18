/**
 * 5×5 L2E catalog drawer: the shared CatalogExplorer wired to the L2E
 * algorithms. The practice card shows the live 3D case; the grid uses the
 * lane's flat 5×5 emblem as icon fallback.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CatalogExplorer,
  type CatalogExplorerPreviewProps,
} from "@/features/last-layer/components/CatalogExplorer";
import { CaseDiagramImage } from "@/features/last-layer/components/CaseDiagramImage";
import type { FiveByFiveL2ECatalogCase } from "../lib/l2eCatalog";

/** Flat 5×5 grid mark (used when a case has no diagram). */
export function FiveByFiveL2EMark({ className }: { className?: string }) {
  const cells: Array<{ x: number; y: number; fill: string }> = [];
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const coreRow = row > 0 && row < 4;
      const coreCol = col > 0 && col < 4;
      const core = coreRow && coreCol;
      const fill = row === 2 && col === 2 ? "#f2c144" : core ? "#e9e9e4" : "#f5f5f0";
      cells.push({
        x: 6 + col * 17,
        y: 6 + row * 17,
        fill,
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
          width="15"
          height="15"
          fill={cell.fill}
          rx="2"
          stroke="#1f2937"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}

function L2EPreview(props: CatalogExplorerPreviewProps) {
  return (
    <CaseDiagramImage
      lane="fiveByFiveL2E"
      {...props}
      fallback={<FiveByFiveL2EMark className="w-full max-w-none" />}
    />
  );
}

export function FiveByFiveL2ECatalogPanel({
  cases,
  masteredKeys,
  activeCase,
  onSelect,
  onMasteredChange,
}: {
  cases: readonly FiveByFiveL2ECatalogCase[];
  masteredKeys: Set<string>;
  activeCase: FiveByFiveL2ECatalogCase | null;
  onSelect: (item: FiveByFiveL2ECatalogCase) => void;
  onMasteredChange?: (keys: Set<string>) => void;
}) {
  const { t } = useLanguage();
  return (
    <CatalogExplorer
      catalog={cases}
      family="l2e"
      familyOptions={null}
      selectedCase={activeCase}
      masteredKeys={masteredKeys}
      onFamily={() => undefined}
      onSelect={item => onSelect(item as FiveByFiveL2ECatalogCase)}
      onMasteredChange={onMasteredChange}
      renderPreview={L2EPreview}
      catalogTitle={t("l2e.catalogTitle")}
      previewHint={t("study.previewHintL2E")}
    />
  );
}
