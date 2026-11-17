/**
 * 3-Style BLD catalog drawer: the shared CatalogExplorer wired to the full
 * BLDDB (edge, corner, special) and the cube-net preview — same learning
 * tools as the other study lanes: group progress, unmastered filter, random
 * practice, bulk mark-as-learned, preview dialog.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { useCallback, useState, type KeyboardEvent } from "react";
import { CubeNet } from "@/components/common/CubeNet";
import { CatalogExplorer, type CatalogExplorerPreviewProps } from "@/features/last-layer/components/CatalogExplorer";
import type { BldStudyCase } from "../lib/bldCatalog";

function BldNetPreview({
  state,
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
      style={{ width: "100%", maxWidth: compact ? "14rem" : "24rem" }}
    >
      <CubeNet state={state} compact={compact} />
    </div>
  );
}

export function BldCatalogPanel({
  cases,
  masteredKeys,
  activeCase,
  onSelect,
  onMasteredChange,
}: {
  cases: readonly BldStudyCase[];
  masteredKeys: Set<string>;
  activeCase: BldStudyCase | null;
  onSelect: (item: BldStudyCase) => void;
  onMasteredChange?: (keys: Set<string>) => void;
}) {
  const { t } = useLanguage();
  const [family, setFamily] = useState<string>("all");
  const FAMILY_OPTIONS = [
    { value: "all", label: t("study.bldFilterAll") },
    { value: "edge", label: t("study.bldFilterEdge") },
    { value: "corner", label: t("study.bldFilterCorner") },
    { value: "special", label: t("study.bldFilterSpecial") },
  ];
  return (
    <CatalogExplorer
      catalog={cases}
      family={family}
      familyOptions={FAMILY_OPTIONS}
      selectedCase={activeCase}
      masteredKeys={masteredKeys}
      onFamily={setFamily}
      onSelect={item => onSelect(item as BldStudyCase)}
      onMasteredChange={onMasteredChange}
      renderPreview={BldNetPreview}
      catalogTitle={t("study.bldCatalogTitle")}
      previewHint={t("study.previewHintCase")}
    />
  );
}
