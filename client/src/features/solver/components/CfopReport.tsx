import { ClipboardCopy, FileJson, Info } from "@/components/ui/BootstrapIcon";
import { IconButton } from "@/components/ui/BootstrapUI";
import { simplePhase } from "@/contexts/LanguageContext";
import { exportCFOPJson, phaseLessonUrl, phaseStudyNote } from "@/lib/solverPresentation";
import type { SolverResult } from "@/lib/solverRuntime";

/** Xưởng Cơ Khí Tốc Độ — report is a readable proof of the CFOP pipeline, not a timer metric. */
export function CfopReport({ result, language, activePhase, cursor, onSelectPhase, onSelectMove }: { result: SolverResult; language: "vi" | "en"; activePhase: string | null; cursor: number; onSelectPhase: (phase: SolverResult["phases"][number]) => void; onSelectMove: (moveIndex: number) => void }) {
  const vi = language === "vi";
  return <section><div className="d-flex flex-wrap align-items-start justify-content-between gap-3 border-bottom pb-3"><div><p className="text-body-secondary small mb-1">{vi ? "CÁC BƯỚC GIẢI" : "SOLUTION STEPS"}</p><h2 className="h4 mb-0">{result.trace.length} {vi ? "lượt xoay" : "turns"}</h2><p className="text-body-secondary mb-0">{vi ? "Bấm vào một chặng để xem và phát các lượt xoay." : "Choose a stage to view and play its turns."}</p></div><IconButton label={vi ? "Lưu các bước giải" : "Save solution steps"} icon={<FileJson className="fs-5" />} onClick={() => exportCFOPJson(result)} className="btn btn-outline-secondary btn-sm" /></div><div className="list-group mt-3">{result.phases.map((phase, index) => <CfopPhaseRow key={phase.name} phase={phase} index={index} language={language} selected={activePhase === phase.name} cursor={cursor} onSelect={onSelectPhase} onSelectMove={onSelectMove} />)}</div></section>;
}

function CfopPhaseRow({ phase, index, language, selected, cursor, onSelect, onSelectMove }: { phase: SolverResult["phases"][number]; index: number; language: "vi" | "en"; selected: boolean; cursor: number; onSelect: (phase: SolverResult["phases"][number]) => void; onSelectMove: (moveIndex: number) => void }) {
  const vi = language === "vi";
  const notation = phase.algorithm || phase.moves.join(" ") || "—";
  const studyNote = phaseStudyNote(phase.name, language);
  const lessonUrl = phaseLessonUrl(phase.name);
  const invariantOK = phase.valid_after && phase.predicate_after;
  const compactName = simplePhase(phase.name, language);
  return <article className={selected ? "list-group-item active" : "list-group-item"}><div className="d-flex flex-wrap align-items-center justify-content-between gap-2"><button type="button" onClick={() => onSelect(phase)} className={selected ? "btn btn-light btn-sm" : "btn btn-outline-secondary btn-sm"}>{String(index + 1).padStart(2, "0")}</button><button type="button" onClick={() => onSelect(phase)} className={selected ? "btn btn-link text-white text-start flex-grow-1 p-0" : "btn btn-link text-body text-start flex-grow-1 p-0"}><strong>{compactName}</strong><small className="d-block">{phase.moves.length} {vi ? "lượt xoay" : "turns"}</small></button><span className={invariantOK ? (selected ? "badge text-bg-light" : "badge text-bg-success") : "badge text-bg-danger"} title={studyNote}>{invariantOK ? "✓" : "!"}</span><a href={lessonUrl} target="_blank" rel="noreferrer" className={selected ? "btn btn-light btn-sm" : "btn btn-outline-secondary btn-sm"} aria-label={vi ? "Xem thêm" : "Learn more"}><Info className="fs-5" /></a><IconButton label={vi ? "Sao chép lượt xoay" : "Copy turns"} icon={<ClipboardCopy className="fs-5" />} onClick={() => navigator.clipboard?.writeText(notation)} className={selected ? "btn btn-light btn-sm" : "btn btn-outline-secondary btn-sm"} /></div><code className="d-block text-break mt-2">{notation}</code>{phase.moves.length > 0 && <div className="btn-group flex-wrap mt-2" role="group">{phase.moves.map((move, moveIndex) => { const movePosition = phase.start + moveIndex + 1; return <button key={`${phase.name}-${movePosition}-${move}`} type="button" onClick={() => onSelectMove(movePosition)} className={cursor === movePosition ? "btn btn-primary btn-sm" : "btn btn-outline-secondary btn-sm"}>{move}</button>; })}</div>}</article>;
}
