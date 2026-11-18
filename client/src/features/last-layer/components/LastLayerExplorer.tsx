/**
 * Last Layer catalog drawer: the shared CatalogExplorer wired to the
 * last-layer data (ZBLL / 1LLL) and the generated flat LL case diagrams
 * from /diagrams/lastLayer — the same style as the other redesigned
 * lanes. The old inline PracticeGroupPreview is kept as the fallback for
 * a missing or broken diagram. Kept as a thin wrapper so existing call
 * sites and tests stay unchanged.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { CatalogExplorer } from "./CatalogExplorer";
import { PracticeGroupPreview } from "./PracticeGroupPreview";
import { CaseDiagramImage } from "./CaseDiagramImage";
import type { LastLayerCatalogCase } from "@/lib/solverRuntime";
import type { ComponentType } from "react";
import type { CatalogExplorerPreviewProps } from "./CatalogExplorer";

type Family = "all" | "zbll" | "1lll";
type Props = {
  catalog: LastLayerCatalogCase[];
  family: Family;
  selectedCase: LastLayerCatalogCase | null;
  masteredKeys: Set<string>;
  onFamily: (family: Family) => void;
  onSelect: (catalogCase: LastLayerCatalogCase) => void;
  /** Nhận tập hợp case đã thuộc mới sau một thao tác hàng loạt. */
  onMasteredChange?: (keys: Set<string>) => void;
};

function LastLayerDiagramPreview(props: CatalogExplorerPreviewProps) {
  return (
    <CaseDiagramImage
      lane="lastLayer"
      {...props}
      state={`lastLayer:${props.label}`}
      fallback={<PracticeGroupPreview {...props} />}
    />
  );
}

const LastLayerPreview: ComponentType<CatalogExplorerPreviewProps> =
  LastLayerDiagramPreview;

export function LastLayerExplorer({
  catalog,
  family,
  selectedCase,
  masteredKeys,
  onFamily,
  onSelect,
  onMasteredChange,
}: Props) {
  const { t } = useLanguage();
  return (
    <CatalogExplorer
      catalog={catalog}
      family={family}
      selectedCase={selectedCase}
      masteredKeys={masteredKeys}
      onFamily={family => onFamily(family as Family)}
      onSelect={item => onSelect(item as LastLayerCatalogCase)}
      onMasteredChange={onMasteredChange}
      renderPreview={LastLayerPreview}
      catalogTitle={t("study.catalogTitle")}
      previewHint={t("study.previewHint")}
    />
  );
}
