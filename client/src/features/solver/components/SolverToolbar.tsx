import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export type SolverKind = "cfop" | "bld";
export type SolverInputMode = "scramble" | "state";

export type SolverToolbarProps = {
  solverKind: SolverKind;
  onSolverKindChange: (kind: SolverKind) => void;
  mode: SolverInputMode;
  onModeChange: (mode: SolverInputMode) => void;
  loading: boolean;
  status: string;
  hint?: string;
  onResetDefaults?: () => void;
};

/**
 * The bar above the workspace. It used to be a whole card of its own, which
 * pushed the two real panels down the page; now it is one quiet line: what
 * kind of solver, what kind of input, and whether the engine is ready.
 */
export function SolverToolbar({
  solverKind,
  onSolverKindChange,
  mode,
  onModeChange,
  loading,
  status,
  hint,
  onResetDefaults,
}: SolverToolbarProps) {
  const { t } = useLanguage();

  const segment = (active: boolean) => cn("btn btn-sm", active ? "btn-primary" : "btn-outline-secondary");

  return (
    <div className="cfop-solver-bar">
      <div className="cfop-solver-bar__row">
        <div className="cfop-solver-bar__group">
          <span className="cfop-solver-bar__label" id="solver-kind-label">{t("home.modeLabel")}</span>
          <div className="btn-group" role="group" aria-labelledby="solver-kind-label">
            <button type="button" aria-pressed={solverKind === "cfop"} className={segment(solverKind === "cfop")} onClick={() => onSolverKindChange("cfop")}>
              {t("home.tab.solve")}
            </button>
            <button type="button" aria-pressed={solverKind === "bld"} className={segment(solverKind === "bld")} onClick={() => onSolverKindChange("bld")}>
              {t("home.tab.bld")}
            </button>
          </div>
        </div>

        <div className="cfop-solver-bar__group">
          <span className="cfop-solver-bar__label" id="solver-input-label">{t("home.inputLabel")}</span>
          <div className="btn-group" role="group" aria-labelledby="solver-input-label">
            <button type="button" aria-pressed={mode === "scramble"} className={segment(mode === "scramble")} onClick={() => onModeChange("scramble")}>
              {t("home.modeScramble")}
            </button>
            <button type="button" aria-pressed={mode === "state"} className={segment(mode === "state")} onClick={() => onModeChange("state")}>
              {t("home.modeState")}
            </button>
          </div>
        </div>

        <p className="cfop-solver-bar__status" role="status" aria-live="polite">
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              <span>{status}</span>
            </>
          ) : (
            <>
              <span className="cfop-solver-bar__dot" aria-hidden="true" />
              <span>{t("home.ready")}</span>
            </>
          )}
        </p>
      </div>

      {hint ? (
        <p className="cfop-solver-bar__hint">
          <span>{hint}</span>
          {onResetDefaults ? (
            <button type="button" className="btn btn-link btn-sm p-0 ms-1" onClick={onResetDefaults}>{t("home.resetDefaults")}</button>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
