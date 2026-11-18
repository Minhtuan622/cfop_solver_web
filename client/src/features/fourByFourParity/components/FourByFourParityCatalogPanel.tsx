/**
 * 4×4 Parity catalog drawer: the shared CatalogExplorer wired to the PLL
 * parity algorithms and the extracted cubingapp.com case diagrams. The
 * practice card itself shows the live 3D case.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CatalogExplorer,
  type CatalogExplorerPreviewProps,
} from "@/features/last-layer/components/CatalogExplorer";
import { CaseDiagramImage } from "@/features/last-layer/components/CaseDiagramImage";
import { CubeAlgorithmReplay } from "@/components/common/CubeAlgorithmReplay";
import {
  fourByFourParityScrambleOf,
  toCubingNotation,
} from "../lib/fourByFourParityAlg";
import type { FourByFourParityCatalogCase } from "../lib/fourByFourParityCatalog";

/** Flat 4×4 grid mark (used when a case has no diagram). */
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

function ParityPreview(props: CatalogExplorerPreviewProps) {
  return (
    <CaseDiagramImage
      lane="fourByFourParity"
      {...props}
      fallback={<FourByFourMark className="w-full max-w-none" />}
    />
  );
}

function ParityReplayPreview({
  algorithm,
  replayToken,
}: CatalogExplorerPreviewProps) {
  const { language } = useLanguage();
  const setup = algorithm ? fourByFourParityScrambleOf(algorithm) : "";
  const play = algorithm ? toCubingNotation(algorithm) : "";
  return (
    <div className="h-72 w-full overflow-hidden rounded-xl bg-surface">
      <CubeAlgorithmReplay
        eventId="444"
        puzzle="4x4x4"
        scramble={setup}
        algorithm={play}
        language={language}
        replayToken={replayToken}
      />
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
      renderPreview={ParityPreview}
      dialogPreview={ParityReplayPreview}
      dialogReplayLabel={t("study.replayAlgorithm")}
      catalogTitle={t("parity.catalogTitle")}
      previewHint={t("study.previewHintReplay")}
    />
  );
}
