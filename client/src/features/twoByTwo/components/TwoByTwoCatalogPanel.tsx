/**
 * 2×2 catalog drawer: the shared CatalogExplorer wired to the 2×2 CLL/PBL/EG
 * data and the generated flat case diagrams from /diagrams/twoByTwo — the
 * same style as the other redesigned lanes. The inline cube-net preview is
 * kept as the fallback for a missing or broken diagram.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { useCallback, type KeyboardEvent } from "react";
import { CubeNet2x2 } from "@/components/common/CubeNet2x2";
import { CaseDiagramImage } from "@/features/last-layer/components/CaseDiagramImage";
import {
  CatalogExplorer,
  type CatalogExplorerPreviewProps,
} from "@/features/last-layer/components/CatalogExplorer";
import type { TwoByTwoCatalogCase } from "../lib/twoByTwoCatalog";

function TwoByTwoInlinePreview({
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
      style={{ width: "100%", maxWidth: compact ? "6.5rem" : "24rem" }}
    >
      <CubeNet2x2 state={state} className="w-full max-w-none" />
    </div>
  );
}

function TwoByTwoNetPreview(props: CatalogExplorerPreviewProps) {
  return (
    <CaseDiagramImage
      lane="twoByTwo"
      {...props}
      state={`twoByTwo:${props.label}`}
      fallback={<TwoByTwoInlinePreview {...props} />}
    />
  );
}

export function TwoByTwoCatalogPanel({
  cases,
  masteredKeys,
  activeCase,
  onSelect,
  onMasteredChange,
}: {
  cases: readonly TwoByTwoCatalogCase[];
  masteredKeys: Set<string>;
  activeCase: TwoByTwoCatalogCase | null;
  onSelect: (item: TwoByTwoCatalogCase) => void;
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
      onSelect={item => onSelect(item as TwoByTwoCatalogCase)}
      onMasteredChange={onMasteredChange}
      renderPreview={TwoByTwoNetPreview}
      catalogTitle={t("twoByTwo.catalogTitle")}
      previewHint={t("study.previewHint2x2")}
    />
  );
}
