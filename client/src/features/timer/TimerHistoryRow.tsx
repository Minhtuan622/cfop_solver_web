import { Pencil, Play, Tag, Trash2 } from "@/components/ui/BootstrapIcon";
import { IconButton } from "@/components/ui/BootstrapUI";
import { formatSolveResult, type SolveHistoryEntry, type SolvePenalty, type SplitPhase } from "@/lib/solveHistory";

type TimerHistoryRowProps = {
  item: SolveHistoryEntry;
  vi: boolean;
  phaseTargets: Record<SplitPhase, number>;
  selected: boolean;
  onSelect: () => void;
  onPenalty: (item: SolveHistoryEntry, penalty: SolvePenalty) => void;
  onReplay: (item: SolveHistoryEntry) => void;
  onEdit: (item: SolveHistoryEntry) => void;
  onDelete: (item: SolveHistoryEntry) => void;
  labels: {
    moves: string;
    inspect: string;
    overTarget: string;
    plusTwo: string;
    dnf: string;
    playback: string;
    edit: string;
    remove: string;
  };
};

export function TimerHistoryRow({ item, vi, phaseTargets, selected, onSelect, onPenalty, onReplay, onEdit, onDelete, labels }: TimerHistoryRowProps) {
  return (
    <article className="list-group-item">
      <div className="row g-3 align-items-center">
        <div className="col-auto">
          <input type="checkbox" checked={selected} onChange={onSelect} className="form-check-input" aria-label={`Select ${item.id}`} />
        </div>
        <div className="col">
          <p className="font-monospace text-break mb-1">{item.input}</p>
          <p className="small text-body-secondary mb-2">
            {new Date(item.createdAt).toLocaleString(vi ? "vi-VN" : "en-US")} · {item.moves} {labels.moves}
            {item.inspectionMs > 0 ? ` · ${labels.inspect} ${(item.inspectionMs / 1000).toFixed(2)}s` : ""}
          </p>
          {item.phaseSplits.length > 0 ? (
            <div className="d-flex flex-wrap gap-1 mb-2">
              {item.phaseSplits.map((split) => {
                const over = split.elapsedMs > phaseTargets[split.phase] * 1000;
                return <span key={split.phase} className={over ? "badge text-bg-danger" : "badge text-bg-success"}>{split.phase} {(split.elapsedMs / 1000).toFixed(2)}s{over ? ` · ${labels.overTarget}` : ""}</span>;
              })}
            </div>
          ) : null}
          {item.tags.length > 0 ? <div className="d-flex flex-wrap gap-1 mb-2">{item.tags.map((tag) => <span key={tag} className="badge text-bg-secondary"><Tag className="fs-6 me-1" />{tag}</span>)}</div> : null}
          {item.note ? <p className="small fst-italic text-body-secondary mb-0">{item.note}</p> : null}
        </div>
        <div className="col-12 col-lg-auto d-flex flex-wrap align-items-center gap-1">
          <div className="btn-group btn-group-sm" role="group">
            <button type="button" onClick={() => onPenalty(item, "+2")} className={item.penalty === "+2" ? "btn btn-warning" : "btn btn-outline-secondary"}>{labels.plusTwo}</button>
            <button type="button" onClick={() => onPenalty(item, "DNF")} className={item.penalty === "DNF" ? "btn btn-danger" : "btn btn-outline-secondary"}>{labels.dnf}</button>
          </div>
          <IconButton label={labels.playback} icon={<Play className="fs-6" />} disabled={!item.solution.trim()} onClick={() => onReplay(item)} className="btn btn-outline-secondary btn-sm" />
          <IconButton label={labels.edit} icon={<Pencil className="fs-6" />} onClick={() => onEdit(item)} className="btn btn-outline-secondary btn-sm" />
          <IconButton label={labels.remove} icon={<Trash2 className="fs-6" />} onClick={() => onDelete(item)} className="btn btn-outline-danger btn-sm" />
        </div>
        <div className="col-auto"><strong className={item.penalty === "DNF" ? "text-danger" : ""}>{formatSolveResult(item)}</strong></div>
      </div>
    </article>
  );
}
