import { ClipboardCopy, FileJson, Info } from "@/components/ui/BootstrapIcon";
import { IconButton } from "@/components/ui/BootstrapUI";
import { simplePhase, useLanguage } from "@/contexts/LanguageContext";
import { exportCFOPJson, phaseLessonUrl, phaseStudyNote } from "@/lib/solverPresentation";
import type { SolverResult } from "@/lib/solverRuntime";

export function CfopReport({ result, language, activePhase, cursor, onSelectPhase, onSelectMove }: { result: SolverResult; language: "vi" | "en"; activePhase: string | null; cursor: number; onSelectPhase: (phase: SolverResult["phases"][number]) => void; onSelectMove: (moveIndex: number) => void }) {
  const { t } = useLanguage();
  const stages = result.phases.filter((phase) => phase.moves.length > 0).length;
  return <section>
    <div className="d-flex align-items-start justify-content-between gap-2 border-bottom pb-3">
      <div><p className="small text-body-secondary mb-1">{t("home.solutionStepsEyebrow")}</p><h2 className="h5 mb-1">{result.trace.length} {t("home.turnsUnit")}</h2><p className="small text-body-secondary mb-0">{t("home.stages", { count: stages })}</p></div>
      <IconButton label={t("home.saveSteps")} icon={<FileJson className="fs-5" />} onClick={() => exportCFOPJson(result)} className="btn btn-outline-secondary btn-sm" />
    </div>
    <div className="mt-3">
      {result.phases.map((phase, index) => <CfopPhaseRow key={phase.name} phase={phase} index={index} language={language} selected={activePhase === phase.name} cursor={cursor} onSelect={onSelectPhase} onSelectMove={onSelectMove} />)}
    </div>
  </section>;
}

function CfopPhaseRow({ phase, index, language, selected, cursor, onSelect, onSelectMove }: { phase: SolverResult["phases"][number]; index: number; language: "vi" | "en"; selected: boolean; cursor: number; onSelect: (phase: SolverResult["phases"][number]) => void; onSelectMove: (moveIndex: number) => void }) {
  const { t } = useLanguage();
  const notation = phase.algorithm || phase.moves.join(" ") || "—";
  const studyNote = phaseStudyNote(phase.name, language);
  const lessonUrl = phaseLessonUrl(phase.name);
  const invariantOK = phase.valid_after && phase.predicate_after;
  const compactName = simplePhase(phase.name, language);
  const rowClass = selected ? "position-relative border-start border-3 border-primary bg-primary-subtle rounded-3 p-3 mb-2" : "position-relative border-start border-3 border-primary-subtle bg-body-tertiary rounded-3 p-3 mb-2";
  return <article className={rowClass}>
    <div className="d-flex align-items-center gap-2">
      <button type="button" onClick={() => onSelect(phase)} className={selected ? "btn btn-primary rounded-circle flex-shrink-0" : "btn btn-outline-primary rounded-circle flex-shrink-0"} aria-label={`${index + 1} ${compactName}`}>{String(index + 1).padStart(2, "0")}</button>
      <button type="button" onClick={() => onSelect(phase)} className="btn btn-link text-body text-start text-decoration-none flex-grow-1 p-0"><strong className="d-block">{compactName}</strong><small className="text-body-secondary">{phase.moves.length} {t("home.turnsUnit")}</small></button>
      <span className={invariantOK ? "badge rounded-circle text-bg-success" : "badge rounded-circle text-bg-danger"} title={studyNote}>{invariantOK ? "✓" : "!"}</span>
      <a href={lessonUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-light" aria-label={t("home.learnMore")}><Info className="fs-5" /></a>
      <IconButton label={t("home.copyTurns")} icon={<ClipboardCopy className="fs-5" />} onClick={() => navigator.clipboard?.writeText(notation)} className="btn btn-sm btn-light" />
    </div>
    <code className="d-block text-break mt-2 small">{notation}</code>
    {phase.moves.length > 0 && <div className="btn-group flex-wrap mt-2" role="group">{phase.moves.map((move, moveIndex) => { const movePosition = phase.start + moveIndex + 1; return <button key={`${phase.name}-${movePosition}-${move}`} type="button" onClick={() => onSelectMove(movePosition)} className={cursor === movePosition ? "btn btn-primary btn-sm" : "btn btn-outline-secondary btn-sm"}>{move}</button>; })}</div>}
  </article>;
}
