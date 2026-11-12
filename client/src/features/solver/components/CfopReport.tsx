import { useState } from "react";
import {
  CheckCircleFill,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  FileJson,
  Info,
} from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/StudioUI";
import { Chip } from "@/components/ui/DesignSystem";
import { simplePhase, useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  exportCFOPJson,
  phaseLessonUrl,
  phaseStudyNote,
} from "@/lib/solverPresentation";
import type { SolverResult } from "@/lib/solverRuntime";
import { Button } from "@/components/ui/Button";

const COLLAPSED_PHASES = 4;
type Phase = SolverResult["phases"][number];

export function CfopReport({
  result,
  language,
  activePhase,
  cursor,
  onSelectPhase,
  onSelectMove,
}: {
  result: SolverResult;
  language: "vi" | "en";
  activePhase: string | null;
  cursor: number;
  onSelectPhase: (phase: Phase) => void;
  onSelectMove: (moveIndex: number) => void;
}) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const stages = result.phases.filter(phase => phase.moves.length > 0).length;
  const hidden = Math.max(0, result.phases.length - COLLAPSED_PHASES);
  // Never hide the phase that is being played.
  const activeIndex = result.phases.findIndex(
    phase => phase.name === activePhase
  );
  const visible =
    expanded || activeIndex >= COLLAPSED_PHASES
      ? result.phases
      : result.phases.slice(0, COLLAPSED_PHASES);
  const showToggle =
    hidden > 0 && !(activeIndex >= COLLAPSED_PHASES && !expanded);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <p className="mb-0 text-sm text-muted">
          {result.trace.length} {t("home.turnsUnit")} ·{" "}
          {t("home.stages", { count: stages })}
        </p>
        <IconButton
          label={t("home.saveSteps")}
          icon={<FileJson className="text-base" />}
          onClick={() => exportCFOPJson(result)}
          className="rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs text-ink transition hover:bg-surface-3"
        />
      </div>
      {visible.map((phase, index) => (
        <CfopPhaseRow
          key={phase.name}
          phase={phase}
          index={index}
          language={language}
          selected={activePhase === phase.name}
          cursor={cursor}
          onSelect={onSelectPhase}
          onSelectMove={onSelectMove}
        />
      ))}
      {showToggle ? (
        <Button
          variant="soft"
          className="mt-2 flex w-full py-2.5 text-primary focus-visible:outline-none"
          type="button"

          aria-expanded={expanded}
          onClick={() => setExpanded(value => !value)}
        >
          {expanded ? t("home.fewerSteps") : t("home.moreSteps")}
          {expanded ? (
            <ChevronUp className="text-base" aria-hidden="true" />
          ) : (
            <ChevronDown className="text-base" aria-hidden="true" />
          )}
        </Button>
      ) : null}
    </section>
  );
}

function CfopPhaseRow({
  phase,
  index,
  language,
  selected,
  cursor,
  onSelect,
  onSelectMove,
}: {
  phase: Phase;
  index: number;
  language: "vi" | "en";
  selected: boolean;
  cursor: number;
  onSelect: (phase: Phase) => void;
  onSelectMove: (moveIndex: number) => void;
}) {
  const { t } = useLanguage();
  const notation = phase.algorithm || phase.moves.join(" ") || "—";
  const studyNote = phaseStudyNote(phase.name, language);
  const lessonUrl = phaseLessonUrl(phase.name);
  const invariantOK = phase.valid_after && phase.predicate_after;
  const compactName = simplePhase(phase.name, language);
  return (
    <article
      className={cn(
        "mb-2.5 rounded-panel border-2 p-3 transition",
        selected
          ? "border-primary bg-primary-soft/60"
          : "border-transparent bg-surface-2 hover:border-line"
      )}
    >
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={selected ? "primary" : "soft"}
          size="plain"
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums focus-visible:outline-none",
            !selected && "bg-primary-soft text-primary"
          )}
          onClick={() => onSelect(phase)}
          aria-label={`${index + 1} ${compactName}`}
        >
          {String(index + 1).padStart(2, "0")}
        </Button>
        <button
          type="button"
          onClick={() => onSelect(phase)}
          className="grow text-left text-ink"
        >
          <strong className="block text-base font-semibold">
            {compactName}
          </strong>
          <small className="text-muted">
            {phase.moves.length} {t("home.turnsUnit")}
          </small>
        </button>
        <span
          className={
            invariantOK ? "text-lg text-success" : "text-lg text-danger"
          }
          title={studyNote}
          role="img"
          aria-label={invariantOK ? "OK" : "!"}
        >
          {invariantOK ? <CheckCircleFill /> : "!"}
        </span>
        <a
          href={lessonUrl}
          target="_blank"
          rel="noreferrer"
          className="grid h-8 w-8 place-items-center rounded-full border border-line bg-surface text-ink transition hover:bg-surface-3"
          aria-label={t("home.learnMore")}
        >
          <Info className="text-base" />
        </a>
        <IconButton
          label={t("home.copyTurns")}
          icon={<ClipboardCopy className="text-base" />}
          onClick={() => navigator.clipboard?.writeText(notation)}
          className="h-8 w-8 border border-line bg-surface text-ink transition hover:bg-surface-3"
        />
      </div>
      {phase.moves.length > 0 && (
        <div
          className="mt-3 flex flex-wrap gap-1.5"
          role="group"
          aria-label={compactName}
        >
          {phase.moves.map((move, moveIndex) => {
            const movePosition = phase.start + moveIndex + 1;
            return (
              <Chip
                key={`${phase.name}-${movePosition}-${move}`}
                active={cursor === movePosition}
                onClick={() => onSelectMove(movePosition)}
              >
                {move}
              </Chip>
            );
          })}
        </div>
      )}
    </article>
  );
}
