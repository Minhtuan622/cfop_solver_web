import { Camera, Dices, PencilSquare, Play } from "@/components/ui/Icon";
import { PanelHeader, PillInput, Surface } from "@/components/ui/DesignSystem";
import { Field, StatusFeedback } from "@/components/ui/StudioUI";
import { CameraScanner } from "./CameraScanner";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CrossColor, CubeValidation } from "@/lib/solverRuntime";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/StudioDialog";
import type { RecentCubeState } from "../lib/recentStates";
import { SolverDetails } from "./SolverDetails";
import { SolverRecentStates } from "./SolverRecentStates";
import type { SolverInputMode, SolverKind } from "./SolverToolbar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/FormControls";
import { buttonClass } from "@/components/ui/Button";

export type SolverInputPanelProps = {
  solverKind: SolverKind;
  mode: SolverInputMode;
  value: string;
  loading: boolean;
  status: string;
  error: string;
  stateValidation: CubeValidation | null;
  recentStates: RecentCubeState[];
  onValueChange: (value: string) => void;
  onStateEdit: (state: string) => void;
  onRandomScramble: () => void;
  onSolve: () => void;
  onCancel: () => void;
  onSelectRecentState: (state: RecentCubeState) => void;
  onRemoveRecentState: (id: string) => void;
  onCameraState: (state: string) => void;
  advancedOptions?: ReactNode;
  onResetDefaults?: () => void;
  hideCamera?: boolean;
  stateExtras?: ReactNode;
  statePainter?: ReactNode;
  scramblePlaceholder?: string;
};

export function SolverInputPanel({
  solverKind,
  mode,
  value,
  loading,
  status,
  error,
  stateValidation,
  recentStates,
  onValueChange,
  onStateEdit,
  onRandomScramble,
  onSolve,
  onCancel,
  onSelectRecentState,
  onRemoveRecentState,
  onCameraState,
  advancedOptions,
  onResetDefaults,
  hideCamera = false,
  stateExtras,
  statePainter,
  scramblePlaceholder,
}: SolverInputPanelProps) {
  const { t } = useLanguage();
  const [cameraOpen, setCameraOpen] = useState(false);
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
          <div className="rounded-panel px-4 py-3 text-sm bg-info-soft text-ink mb-4">
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
                placeholder={scramblePlaceholder ?? t("home.scramblePlaceholder")}
                spellCheck={false}
                autoComplete="off"
                className="md:h-full"
              />
            </div>
            {loading ? (
              <div className="flex gap-2">
                <div
                  className={`${buttonClass("primary", "plain")} px-6 py-4 grow`}
                  role="status"
                  aria-live="polite"
                >
                  <span
                    className="inline-block h-4 w-4 animate-spin rounded-full align-[-0.125em] h-3.5 w-3.5 mr-2"
                    aria-hidden="true"
                  />
                  {status || t("home.preparing")}
                </div>
                <Button
                  variant="danger"
                  size="md"
                  type="button"

                  onClick={onCancel}
                  aria-label={t("home.cancelSolver")}
                >
                  {t("home.cancelSolver")}
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="md"
                className="px-6 py-4"
                type="button"
                disabled={!value.trim()}
                onClick={onSolve}
              >
                <Play className="text-lg mr-1" aria-hidden="true" />
                {solving ? t("home.buildMemo") : t("input.solve")}
              </Button>
            )}
          </div>
        ) : (
          <>
            {statePainter}
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
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Button
              variant="soft"
              size="sm"
              type="button"

              onClick={onRandomScramble}
              disabled={loading}
            >
              <Dices className="text-base mr-1" aria-hidden="true" />
              {t("home.randomScramble")}
            </Button>
            {onResetDefaults ? (
              <Button
                variant="link"
                size="sm"
                className="p-0 no-underline"
                type="button"

                onClick={onResetDefaults}
              >
                {t("home.resetOptions")}
              </Button>
            ) : null}
            {hideCamera ? null : (
              <Button
                variant="link"
                size="sm"
                className="p-0 no-underline"
                type="button"
                onClick={() => setCameraOpen(true)}
              >
                <Camera className="text-base mr-1" aria-hidden="true" />
                {t("home.cameraScan")}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-sm text-muted">{t("home.stateHint")}</span>
            <Button
              variant="link"
              size="sm"
              className="p-0 no-underline"
              type="button"
              onClick={() => setCameraOpen(true)}
            >
              <Camera className="text-base mr-1" aria-hidden="true" />
              {t("home.cameraScan")}
            </Button>
            {stateExtras}
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
                <Textarea
                  id="home-paste-state"
                  value={value}
                  onChange={event =>
                    onStateEdit(
                      event.target.value.replaceAll(/\s/g, "").toUpperCase()
                    )
                  }
                  spellCheck={false}
                  className="font-mono"
                  rows={3}
                />
              </Field>
            </SolverDetails>
          </>
        ) : null}

        {advancedOptions ? <div className="mt-4">{advancedOptions}</div> : null}

        <Dialog open={cameraOpen} onOpenChange={setCameraOpen}>
          <DialogContent>
            <DialogHeader>
              <div>
                <DialogTitle>{t("home.cameraScan")}</DialogTitle>
                <DialogDescription>{t("home.cameraScanHint")}</DialogDescription>
              </div>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              {cameraOpen ? (
                <CameraScanner
                  onState={state => {
                    onCameraState(state);
                    setCameraOpen(false);
                  }}
                />
              ) : null}
            </div>
          </DialogContent>
        </Dialog>

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
              className={`${buttonClass("primary", "plain")} px-6 py-3 text-base grow`}
              role="status"
              aria-live="polite"
            >
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full align-[-0.125em] h-3.5 w-3.5 mr-2"
                aria-hidden="true"
              />
              {status || t("home.preparing")}
            </div>
            <Button
              type="button"
              variant="danger"
              size="plain"
              className="px-6 py-3 text-base"
              onClick={onCancel}
              aria-label={t("home.cancelSolver")}
            >
              {t("home.cancelSolver")}
            </Button>
          </div>
        ) : mode === "state" ? (
          <button
            type="button"
            disabled={
              !value.trim() || (mode === "state" && !stateValidation?.valid)
            }
            onClick={onSolve}
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-primary text-on-primary hover:bg-primary-hover px-6 py-3 text-base w-full mt-6"
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
