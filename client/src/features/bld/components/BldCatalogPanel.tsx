import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { CatalogExplorer } from "@/features/last-layer/components/CatalogExplorer";
import { BldCasePreview } from "./BldCasePreview";
import type { BldStudyCase } from "../lib/bldCatalog";

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
      renderPreview={BldCasePreview}
      focusStorageKey="bld"
      catalogTitle={t("study.bldCatalogTitle")}
      previewHint={t("study.previewHintCase")}
    />
  );
}
