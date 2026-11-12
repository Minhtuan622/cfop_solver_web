import { useRef, type KeyboardEvent } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { SettingsGroup, SettingsGroupId } from "../lib/settingsGroups";

/**
 * The list of settings groups. The visitor picks one and only that group
 * opens, so the page never shows every option at once.
 */
export function SettingsGroupTabs({
  groups,
  activeId,
  onSelect,
  label,
}: {
  groups: readonly SettingsGroup[];
  activeId: SettingsGroupId;
  onSelect: (id: SettingsGroupId) => void;
  label: string;
}) {
  const { t } = useLanguage();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
    const backward = event.key === "ArrowUp" || event.key === "ArrowLeft";
    if (!forward && !backward) return;
    event.preventDefault();
    const next = (index + (forward ? 1 : -1) + groups.length) % groups.length;
    onSelect(groups[next].id);
    tabs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
    >
      {groups.map((group, index) => {
        const active = group.id === activeId;
        return (
          <button
            key={group.id}
            ref={node => {
              tabs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`settings-tab-${group.id}`}
            aria-selected={active}
            aria-controls={`settings-panel-${group.id}`}
            tabIndex={active ? 0 : -1}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-left text-sm font-medium transition lg:w-full",
              active
                ? "bg-primary text-white"
                : "bg-surface-2 text-muted hover:bg-surface-3 hover:text-ink"
            )}
            onClick={() => onSelect(group.id)}
            onKeyDown={event => move(event, index)}
          >
            {t(group.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
