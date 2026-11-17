/**
 * CFOP catalog drawer: the shared CatalogExplorer wired to the F2L/OLL/PLL
 * data. The OLL-family cases (OLL/PLL/COLL/OLLCP) show the full last-layer
 * cross — the same diagram used by the Last Layer tab — F2L shows the full
 * net. Same learning tools as the last layer tab: group progress, unmastered
 * filter, random practice, bulk mark-as-learned, preview dialog.
 */
import { useLanguage } from "@/contexts/LanguageContext";
import { useCallback, useState, type KeyboardEvent } from "react";
import { CubeNet } from "@/components/common/CubeNet";
import { PracticeGroupPreview } from "@/features/last-layer/components/PracticeGroupPreview";
import {
  CatalogExplorer,
  type CatalogExplorerPreviewProps,
} from "@/features/last-layer/components/CatalogExplorer";
import type { CfopCatalogCase } from "../lib/cfopCatalog";

/** The OLL-family cases — every one of them is a last-layer case. */
const LAST_LAYER_FAMILIES = new Set(["oll", "pll", "coll", "ollcp"]);

function CfopNetPreview({
  state,
  label,
  compact = false,
  onClick,
  family,
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
  if (family && LAST_LAYER_FAMILIES.has(family)) {
    // The whole last layer — not a dimmed net.
    return (
      <PracticeGroupPreview
        state={state}
        label={label}
        compact={compact}
        onClick={onClick}
      />
    );
  }
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
      <CubeNet state={state} />
    </div>
  );
}

const FAMILY_OPTIONS = [
  { value: "all", label: "ALL · F2L + OLL + PLL + COLL + OLLCP" },
  { value: "f2l", label: "F2L" },
  { value: "oll", label: "OLL" },
  { value: "pll", label: "PLL" },
  { value: "coll", label: "COLL" },
  { value: "ollcp", label: "OLLCP" },
] as const;

export function CfopCatalogPanel({
  cases,
  masteredKeys,
  activeCase,
  onSelect,
  onMasteredChange,
}: {
  cases: readonly CfopCatalogCase[];
  masteredKeys: Set<string>;
  activeCase: CfopCatalogCase | null;
  onSelect: (item: CfopCatalogCase) => void;
  onMasteredChange?: (keys: Set<string>) => void;
}) {
  const { t } = useLanguage();
  const [family, setFamily] = useState<string>("all");
  return (
    <CatalogExplorer
      catalog={cases}
      family={family}
      familyOptions={FAMILY_OPTIONS}
      selectedCase={activeCase}
      masteredKeys={masteredKeys}
      onFamily={setFamily}
      onSelect={item => onSelect(item as CfopCatalogCase)}
      onMasteredChange={onMasteredChange}
      renderPreview={CfopNetPreview}
      catalogTitle={t("cfop.catalogTitle")}
      previewHint={t("study.previewHintCase")}
    />
  );
}
