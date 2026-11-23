import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { Dispatch, SetStateAction } from "react";
import type { CatalogGroupEntry } from "../lib/catalogExplorerTypes";

/** Bảng chọn "Bộ tập trung": chỉ hiện các nhóm được tick trong catalog. */
export function CatalogFocusPanel({
  families,
  focusSet,
  setFocusSet,
}: {
  families: CatalogGroupEntry[];
  focusSet: string[];
  setFocusSet: Dispatch<SetStateAction<string[]>>;
}) {
  const { t } = useLanguage();
  const focusActive = focusSet.length > 0;
  return (
      <div className="mt-3 rounded-card bg-surface-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-sm">{t("study.focusSetTitle")}</strong>
          <small className="text-muted">{t("study.focusSetHint")}</small>
          {focusActive ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto text-xs"
              onClick={() => setFocusSet([])}
            >
              {t("study.focusSetClear")}
            </Button>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {families.map(group => {
            const checked = focusSet.includes(group.name);
            return (
              <label
                key={group.name}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  checked
                    ? "bg-primary text-on-primary"
                    : "bg-surface text-ink hover:bg-surface-3"
                )}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() =>
                    setFocusSet(current =>
                      checked
                        ? current.filter(value => value !== group.name)
                        : [...current, group.name]
                    )
                  }
                  aria-label={group.name}
                />
                {group.name}
                <span className="tabular-nums opacity-75">
                  {group.mastered}/{group.total}
                </span>
              </label>
            );
          })}
        </div>
      </div>
  );
}
