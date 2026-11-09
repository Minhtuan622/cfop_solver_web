import { useState } from "react";
import { CheckCircleFill, ClipboardCopy, FileJson, Info } from "@/components/ui/BootstrapIcon";
import { IconButton } from "@/components/ui/BootstrapUI";
import { Chip } from "@/components/ui/DesignSystem";
import { simplePhase, useLanguage } from "@/contexts/LanguageContext";
import { exportCFOPJson, phaseLessonUrl, phaseStudyNote } from "@/lib/solverPresentation";
import type { SolverResult } from "@/lib/solverRuntime";

const COLLAPSED_PHASES = 4;
type Phase = SolverResult["phases"][number];

export function CfopReport({ result, language, activePhase, cursor, onSelectPhase, onSelectMove }: { result: SolverResult; language: "vi" | "en"; activePhase: string | null; cursor: number; onSelectPhase: (phase: Phase) => void; onSelectMove: (moveIndex: number) => void }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const stages = result.phases.filter((phase) => phase.moves.length > 0).length;
  const hidden = Math.max(0, result.phases.length - COLLAPSED_PHASES);
  // Never hide the phase that is being played.
  const activeIndex = result.phases.findIndex((phase) => phase.name === activePhase);
  const visible = expanded || activeIndex >= COLLAPSED_PHASES ? result.phases : result.phases.slice(0, COLLAPSED_PHASES);
  const showToggle = hidden > 0 && !(activeIndex >= COLLAPSED_PHASES && !expanded);

  return <section>
    <div className="d-flex align-items-center justify-content-between gap-2 mb-2 px-1">
      <p className="small text-body-secondary mb-0">{result.trace.length} {t("home.turnsUnit")} · {t("home.stages", { count: stages })}</p>
      <IconButton label={t("home.saveSteps")} icon={<FileJson className="fs-6" />} onClick={() => exportCFOPJson(result)} className="btn btn-sm btn-light" />
    </div>
    {visible.map((phase, index) => <CfopPhaseRow key={phase.name} phase={phase} index={index} language={language} selected={activePhase === phase.name} cursor={cursor} onSelect={onSelectPhase} onSelectMove={onSelectMove} />)}
    {showToggle ? <button type="button" className="ds-more" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? t("home.fewerSteps") : t("home.moreSteps")} <i className={`bi bi-chevron-${expanded ? "up" : "down"} ms-1`} aria-hidden="true" /></button> : null}
  </section>;
}

function CfopPhaseRow({ phase, index, language, selected, cursor, onSelect, onSelectMove }: { phase: Phase; index: number; language: "vi" | "en"; selected: boolean; cursor: number; onSelect: (phase: Phase) => void; onSelectMove: (moveIndex: number) => void }) {
  const { t } = useLanguage();
  const notation = phase.algorithm || phase.moves.join(" ") || "—";
  const studyNote = phaseStudyNote(phase.name, language);
  const lessonUrl = phaseLessonUrl(phase.name);
  const invariantOK = phase.valid_after && phase.predicate_after;
  const compactName = simplePhase(phase.name, language);
  return <article className={selected ? "ds-phase is-active" : "ds-phase"}>
    <div className="d-flex align-items-center gap-3">
      <button type="button" onClick={() => onSelect(phase)} className="ds-phase-num flex-shrink-0" aria-label={`${index + 1} ${compactName}`}>{String(index + 1).padStart(2, "0")}</button>
      <button type="button" onClick={() => onSelect(phase)} className="btn btn-link text-body text-start text-decoration-none flex-grow-1 p-0"><strong className="d-block fs-6">{compactName}</strong><small className="text-body-secondary">{phase.moves.length} {t("home.turnsUnit")}</small></button>
      <span className={invariantOK ? "ds-ok" : "text-danger fs-5"} title={studyNote} role="img" aria-label={invariantOK ? "OK" : "!"}>{invariantOK ? <CheckCircleFill /> : "!"}</span>
      <a href={lessonUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-light" aria-label={t("home.learnMore")}><Info className="fs-6" /></a>
      <IconButton label={t("home.copyTurns")} icon={<ClipboardCopy className="fs-6" />} onClick={() => navigator.clipboard?.writeText(notation)} className="btn btn-sm btn-light" />
    </div>
    {phase.moves.length > 0 && <div className="d-flex flex-wrap gap-2 mt-3" role="group" aria-label={compactName}>{phase.moves.map((move, moveIndex) => { const movePosition = phase.start + moveIndex + 1; return <Chip key={`${phase.name}-${movePosition}-${move}`} active={cursor === movePosition} onClick={() => onSelectMove(movePosition)}>{move}</Chip>; })}</div>}
  </article>;
}
