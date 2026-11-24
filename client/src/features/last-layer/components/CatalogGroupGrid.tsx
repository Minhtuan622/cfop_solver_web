import type { ComponentType } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type {
  CatalogExplorerPreviewProps,
  CatalogGroupEntry,
} from "../lib/catalogExplorerTypes";

export function CatalogGroupGrid({
  groups,
  Preview,
  onOpenGroup,
}: {
  groups: CatalogGroupEntry[];
  Preview: ComponentType<CatalogExplorerPreviewProps>;
  onOpenGroup: (name: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="mt-1 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {groups.map(entry => {
        const percent = entry.total
          ? Math.round((entry.mastered / entry.total) * 100)
          : 0;
        return (
          <div key={entry.name}>
            <button
              type="button"
              onClick={() => onOpenGroup(entry.name)}
              className="h-full w-full rounded-card bg-surface-2 px-5 py-4 text-left transition"
            >
              <div className="flex items-center gap-2">
                <Preview
                  state={entry.previewState}
                  label={entry.name}
                  compact
                  family={entry.family}
                />
                <span className="grow min-w-0">
                  <strong className="block truncate">{entry.name}</strong>
                  <small className="text-muted">
                    {entry.meta ? `${entry.meta} · ` : ""}
                    {entry.mastered}/{entry.total}
                  </small>
                </span>
              </div>
              <span className="bg-surface-3 mt-3 block h-2 w-full overflow-hidden rounded-full">
                <span
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${percent}%` }}
                />
              </span>
            </button>
          </div>
        );
      })}
      {groups.length ? null : (
        <p className="text-sm text-muted mb-0">
          {t("study.noCasesMatch")}
        </p>
      )}
    </div>
  );
}
