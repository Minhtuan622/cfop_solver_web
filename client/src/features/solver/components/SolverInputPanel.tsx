import { Dices, PencilSquare, Play } from "@/components/ui/Icon";
import { PanelHeader, PillInput, Surface } from "@/components/ui/DesignSystem";
import { Field, StatusFeedback } from "@/components/ui/StudioUI";
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
  onCancel: () => void;
  onSelectRecentState: (state: RecentCubeState) => void;
  onRemoveRecentState: (id: string) => void;
  onCameraState: (state: string) => void;
  /** The optional settings that only matter for a wider opening. */
  advancedOptions?: ReactNode;
  onResetDefaults?: () => void;
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
  onCancel,
  onSelectRecentState,
  onRemoveRecentState,
  onCameraState,
  advancedOptions,
  onResetDefaults,
}: SolverInputPanelProps) {
  const { t } = useLanguage();
  const solving = solverKind === "bld";

  return (
    <Surface>
      <PanelHeader
        className="px-6 pt-6 pb-2"
        icon={<PencilSquare />}
        title={
          mode === "scramble"
            ? t("home.inputTitle.scramble")
            : t("home.inputTitle.state")
        }
      />

      <div className="px-6 pb-6">
        {solving ? (
          <div className="rounded-panel border px-4 py-3 text-sm border-info/20 bg-info-soft text-ink">
            <strong>BUFFER / UF (C)</strong> · UBL (A)
            <br />
            {t("home.bldPrepare")}
          </div>
        ) : null}

        {mode === "scramble" ? (
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            <div className="grow">
              <label htmlFor="home-scramble" className="sr-only">
                {t("home.scrambleField")}
              </label>
              <PillInput
                id="home-scramble"
                type="text"
                value={value}
                onChange={event => onValueChange(event.target.value)}
                placeholder={t("home.scramblePlaceholder")}
                spellCheck={false}
                autoComplete="off"
                className="h-full"
              />
            </div>
            {loading ? (
              <div className="flex gap-2">
                <div
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover px-6 py-4 grow"
                  role="status"
                  aria-live="polite"
                >
                  <span
                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent align-[-0.125em] h-3.5 w-3.5 mr-2"
                    aria-hidden="true"
                  />
                  {status || t("home.preparing")}
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-danger/35 bg-transparent text-danger hover:bg-danger-soft"
                  onClick={onCancel}
                  aria-label={t("home.cancelSolver")}
                >
                  {t("home.cancelSolver")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={!value.trim()}
                onClick={onSolve}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover px-6 py-4"
              >
                <Play className="text-lg mr-1" aria-hidden="true" />
                {solving ? t("home.buildMemo") : t("input.solve")}
              </button>
            )}
          </div>
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
            <p className="text-sm text-muted mt-2">{t("home.paintHint")}</p>
            <div className="mt-4">
              <StatusFeedback
                tone={
                  !stateValidation
                    ? "secondary"
                    : stateValidation.valid
                      ? "success"
                      : "danger"
                }
              >
                {stateValidation?.valid
                  ? `✓ ${stateValidation.message}`
                  : (stateValidation?.message ?? t("home.waitingValidation"))}
              </StatusFeedback>
            </div>
          </>
        )}

        {mode === "scramble" ? (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 px-3 py-1.5 text-xs border-line bg-surface-2 text-ink hover:bg-surface-3"
              onClick={onRandomScramble}
              disabled={loading}
            >
              <Dices className="text-base mr-1" aria-hidden="true" />
              {t("home.randomScramble")}
            </button>
            {onResetDefaults ? (
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 px-3 py-1.5 text-xs border-0 bg-transparent p-0 text-primary hover:underline no-underline"
                onClick={onResetDefaults}
              >
                {t("home.resetOptions")}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-sm text-muted">{t("home.stateHint")}</span>
          </div>
        )}

        {mode === "state" ? (
          <>
            <SolverRecentStates
              states={recentStates}
              onSelect={onSelectRecentState}
              onRemove={onRemoveRecentState}
            />
            <SolverDetails summary={t("home.pasteState")} className="mt-4">
              <Field id="home-paste-state" label={t("home.stateField")}>
                <textarea
                  id="home-paste-state"
                  value={value}
                  onChange={event =>
                    onStateEdit(
                      event.target.value.replaceAll(/\s/g, "").toUpperCase()
                    )
                  }
                  spellCheck={false}
                  className="w-full rounded-field border border-line bg-surface px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 font-mono"
                  rows={3}
                />
              </Field>
            </SolverDetails>
          </>
        ) : null}

        {advancedOptions ? <div className="mt-4">{advancedOptions}</div> : null}

        <div className="mt-4">
          <SolverDetails summary={t("home.cameraSection")}>
            <CameraScanner onState={onCameraState} />
          </SolverDetails>
        </div>

        {error ? (
          <div className="mt-4">
            <StatusFeedback tone="danger" title={t("home.solverFailed")}>
              {error}
            </StatusFeedback>
          </div>
        ) : null}

        {mode === "state" && loading ? (
          <div className="flex gap-2 mt-6">
            <div
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover px-6 py-3 text-base grow"
              role="status"
              aria-live="polite"
            >
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent align-[-0.125em] h-3.5 w-3.5 mr-2"
                aria-hidden="true"
              />
              {status || t("home.preparing")}
            </div>
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-danger/35 bg-transparent text-danger hover:bg-danger-soft px-6 py-3 text-base"
              )}
              onClick={onCancel}
              aria-label={t("home.cancelSolver")}
            >
              {t("home.cancelSolver")}
            </button>
          </div>
        ) : mode === "state" ? (
          <button
            type="button"
            disabled={
              !value.trim() || (mode === "state" && !stateValidation?.valid)
            }
            onClick={onSolve}
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover px-6 py-3 text-base w-full mt-6"
            )}
          >
            <Play className="text-lg mr-1" aria-hidden="true" />
            {solving ? t("home.buildMemo") : t("input.solve")}
          </button>
        ) : null}
      </div>
    </Surface>
  );
}
