import { Dices, Sparkles } from "@/components/ui/BootstrapIcon";
import { Field, StatusFeedback } from "@/components/ui/BootstrapUI";
import { CameraScanner } from "@/components/common/CameraScanner";
import { CubeStateEditor } from "@/components/common/CubeStateEditor";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CrossColor, CubeValidation } from "@/lib/solverRuntime";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { RecentCubeState } from "../lib/recentStates";
import { SolverDetails } from "./SolverDetails";
import { SolverRecentStates } from "./SolverRecentStates";
import type { SolverInputMode, SolverKind } from "./SolverToolbar";

export type SolverInputPanelProps = {
  solverKind: SolverKind;
  mode: SolverInputMode;
  value: string;
  loading: boolean;
  status: string;
  error: string;
  stateValidation: CubeValidation | null;
  paintColor: CrossColor;
  canUndo: boolean;
  canRedo: boolean;
  recentStates: RecentCubeState[];
  onValueChange: (value: string) => void;
  onStateEdit: (state: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onPaintColorChange: (color: CrossColor) => void;
  onRandomScramble: () => void;
  onSolve: () => void;
  onSelectRecentState: (state: RecentCubeState) => void;
  onRemoveRecentState: (id: string) => void;
  onCameraState: (state: string) => void;
  /** The optional settings that only matter for a wider opening. */
  advancedOptions?: ReactNode;
};

/**
 * Everything that goes into the solver: the scramble, or the painted cube.
 * The panel owns the field labels; the page owns the values.
 */
export function SolverInputPanel({
  solverKind,
  mode,
  value,
  loading,
  status,
  error,
  stateValidation,
  paintColor,
  canUndo,
  canRedo,
  recentStates,
  onValueChange,
  onStateEdit,
  onUndo,
  onRedo,
  onPaintColorChange,
  onRandomScramble,
  onSolve,
  onSelectRecentState,
  onRemoveRecentState,
  onCameraState,
  advancedOptions,
}: SolverInputPanelProps) {
  const { t } = useLanguage();
  const solving = solverKind === "bld";

  return (
    <section className="card cfop-card-surface">
      <header className="cfop-solver-panel__header">
        <h2 className="h6 mb-0">{t("home.inputTitle")}</h2>
        <span className="badge text-bg-light">{mode === "scramble" ? t("home.scrambleBadge") : t("home.stateBadge")}</span>
      </header>

      <div className="card-body">
        {solving ? <div className="alert alert-info small"><strong>BUFFER / UF (C)</strong> · UBL (A)<br />{t("home.bldPrepare")}</div> : null}

        {mode === "scramble" ? (
          <Field id="home-scramble" label={t("home.scrambleField")}>
            <textarea
              id="home-scramble"
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              placeholder={t("home.scramblePlaceholder")}
              spellCheck={false}
              className="form-control font-monospace"
              rows={5}
            />
          </Field>
        ) : (
          <>
            <CubeStateEditor
              state={value}
              onChange={onStateEdit}
              disabled={loading}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={onUndo}
              onRedo={onRedo}
              selectedColor={paintColor}
              onSelectedColorChange={onPaintColorChange}
              controlsOnly
            />
            <p className="small text-body-secondary mt-2">{t("home.paintHint")}</p>
            <div className="mt-3">
              <StatusFeedback tone={!stateValidation ? "secondary" : stateValidation.valid ? "success" : "danger"}>
                {stateValidation?.valid ? `✓ ${stateValidation.message}` : stateValidation?.message ?? t("home.waitingValidation")}
              </StatusFeedback>
            </div>
          </>
        )}

        {mode === "scramble" ? (
          <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onRandomScramble} disabled={loading}>
              <Dices className="fs-6 me-1" aria-hidden="true" />
              {t("home.randomScramble")}
            </button>
            <span className="small text-body-secondary">{t("home.scrambleHint")}</span>
          </div>
        ) : (
          <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
            <span className="small text-body-secondary">{t("home.stateHint")}</span>
          </div>
        )}

        {mode === "state" ? (
          <>
            <SolverRecentStates states={recentStates} onSelect={onSelectRecentState} onRemove={onRemoveRecentState} />
            <SolverDetails summary={t("home.pasteState")} className="mt-3">
              <Field id="home-paste-state" label={t("home.stateField")}>
                <textarea
                  id="home-paste-state"
                  value={value}
                  onChange={(event) => onStateEdit(event.target.value.replaceAll(/\s/g, "").toUpperCase())}
                  spellCheck={false}
                  className="form-control font-monospace"
                  rows={3}
                />
              </Field>
            </SolverDetails>
          </>
        ) : null}

        {advancedOptions ? <div className="mt-3">{advancedOptions}</div> : null}

        <div className="mt-3">
          <SolverDetails summary={t("home.cameraSection")} className="cfop-solver-details--bare">
            <CameraScanner onState={onCameraState} />
          </SolverDetails>
        </div>

        {error ? (
          <div className="mt-3">
            <StatusFeedback tone="danger" title={t("home.solverFailed")}>{error}</StatusFeedback>
          </div>
        ) : null}

        <button
          type="button"
          disabled={loading || !value.trim() || (mode === "state" && !stateValidation?.valid)}
          onClick={onSolve}
          className={cn("btn btn-primary btn-lg w-100 mt-4")}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              {status || t("home.preparing")}
            </>
          ) : (
            <>
              <Sparkles className="fs-6 me-1" aria-hidden="true" />
              {solving ? t("home.buildMemo") : t("input.solve")}
            </>
          )}
        </button>
      </div>
    </section>
  );
}
