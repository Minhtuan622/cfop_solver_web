import type { ComponentType } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type {
  CatalogExplorerCase,
  CatalogExplorerPreviewProps,
} from "../lib/catalogExplorerTypes";

/** Thẻ một case trong nhóm đang mở: hình, tên, thuật toán và nút học (hoặc ô chọn khi chọn hàng loạt). */
export function CatalogCaseCard({
  catalogCase,
  mastered,
  active,
  selected,
  selectionMode,
  Preview,
  replayToken,
  onToggleSelected,
  onPreview,
  onStudy,
}: {
  catalogCase: CatalogExplorerCase;
  mastered: boolean;
  /** Case đang được học trong thẻ luyện tập. */
  active: boolean;
  selected: boolean;
  selectionMode: boolean;
  Preview: ComponentType<CatalogExplorerPreviewProps>;
  replayToken: number;
  onToggleSelected: () => void;
  onPreview: () => void;
  onStudy: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div
      className={cn(
        "h-full rounded-card bg-surface",
        selectionMode && "cursor-pointer"
      )}
      onClick={event => {
          if (!selectionMode) return;
          if (
            (event.target as HTMLElement).closest(
              "button, a, input, label, select, textarea"
            )
          )
            return;
          onToggleSelected();
        }}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <Preview
            state={catalogCase.state}
            label={catalogCase.id}
            compact
            family={catalogCase.family}
            algorithm={catalogCase.algorithm}
            replayToken={replayToken}
            onClick={onPreview}
          />
          <div className="flex shrink-0 items-center gap-2">
            {selectionMode ? (
              <Checkbox
                checked={selected}
                onChange={onToggleSelected}
                ariaLabel={`${t("study.bulkSelect")} ${catalogCase.id}`}
              />
            ) : null}
            {mastered ? (
              <span
                className={
                  active
                    ? "inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-on-primary"
                    : "inline-flex items-center rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-on-success"
                }
              >
                ✓
              </span>
            ) : null}
          </div>
        </div>
        <strong className="mt-4 block">
          {catalogCase.name ?? catalogCase.id}
        </strong>
        <small className="text-muted mt-1 block">
          {catalogCase.family.toUpperCase()} ·{" "}
          {catalogCase.group}
        </small>
        <code
          className="text-muted mt-2 block truncate text-sm"
          title={catalogCase.algorithm}
        >
          {catalogCase.algorithm}
        </code>
        {selectionMode ? null : (
          <Button
            type="button"
            variant="outline"
            size="plain"
            className="mt-4 px-3 py-1.5 text-xs"
            onClick={onStudy}
          >
            {t("study.studyThisCase")}
          </Button>
        )}
      </div>
    </div>
  );
}
