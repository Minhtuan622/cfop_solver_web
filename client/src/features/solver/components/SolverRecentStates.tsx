import { History, Trash2 } from "@/components/ui/BootstrapIcon";
import { IconButton } from "@/components/ui/BootstrapUI";
import { useLanguage } from "@/contexts/LanguageContext";
import type { RecentCubeState } from "../lib/recentStates";

export type SolverRecentStatesProps = {
  states: RecentCubeState[];
  onSelect: (state: RecentCubeState) => void;
  onRemove: (id: string) => void;
};

/** The cube states the visitor painted earlier, one click away. */
export function SolverRecentStates({ states, onSelect, onRemove }: SolverRecentStatesProps) {
  const { t } = useLanguage();
  if (!states.length) return null;

  return (
    <section className="cfop-solver-recent">
      <h3 className="cfop-solver-subtitle"><History className="me-1" aria-hidden="true" />{t("home.recentStates")}</h3>
      <ul className="list-group list-group-flush">
        {states.map((item) => (
          <li key={item.id} className="list-group-item d-flex align-items-center gap-2 px-0 bg-transparent">
            <button type="button" onClick={() => onSelect(item)} className="btn btn-link text-start text-truncate flex-grow-1 p-0">{item.label}</button>
            <IconButton label={t("home.removeState", { label: item.label })} icon={<Trash2 className="fs-6" />} onClick={() => onRemove(item.id)} className="btn btn-outline-danger btn-sm" />
          </li>
        ))}
      </ul>
    </section>
  );
}
