import { History, Trash2 } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import type { RecentCubeState } from "../lib/recentStates";

export type SolverRecentStatesProps = {
  states: RecentCubeState[];
  onSelect: (state: RecentCubeState) => void;
  onRemove: (id: string) => void;
};

/** The cube states the visitor painted earlier, one click away. */
export function SolverRecentStates({
  states,
  onSelect,
  onRemove,
}: SolverRecentStatesProps) {
  const { t } = useLanguage();
  if (!states.length) return null;

  return (
    <section className="mt-4">
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        <History className="text-base" aria-hidden="true" />
        {t("home.recentStates")}
      </h3>
      <ul className="divide-y divide-line overflow-hidden rounded-panel border border-line bg-surface-2/60">
        {states.map(item => (
          <li key={item.id} className="flex items-center gap-2 px-3 py-1.5">
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="grow truncate text-left text-sm font-medium text-primary transition hover:text-primary-hover hover:underline"
            >
              {item.label}
            </button>
            <IconButton
              label={t("home.removeState", { label: item.label })}
              icon={<Trash2 className="text-base" />}
              onClick={() => onRemove(item.id)}
              className="h-8 w-8 text-danger transition hover:bg-danger-soft"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
