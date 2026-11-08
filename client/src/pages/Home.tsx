/**
 * Soft Focus Workspace: a calm, reusable desktop-first Rubik canvas. Surfaces are
 * grouped by spacing, soft elevation and color—not decorative borders—while 3D cube
 * movement remains the sole rich animation.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Timer } from "@/components/ui/BootstrapIcon";
import { Link } from "wouter";
import { CubeNet, SOLVED_STATE } from "@/components/common/CubeNet";
import { Cube3DGuide } from "@/components/common/Cube3DGuide";
import { BldReport } from "@/features/bld";
import {
  CfopReport,
  SolverF2LOptions,
  SolverInputPanel,
  SolverSolutionPanel,
  SolverToolbar,
  readRecentStates,
  rememberRecentState,
  writeRecentStates,
  type RecentCubeState,
  type SolverInputMode,
  type SolverKind,
} from "@/features/solver";
import { stateFromScramble } from "@/lib/fastCube";
import { simplePhase, useLanguage } from "@/contexts/LanguageContext";
import { randomThreeByThreeScramble } from "@/lib/cubeScramble";
import { lastLayerModeLabel, openingModeLabel } from "@/lib/solverPresentation";
import { readSolverSettings } from "@/lib/appSettings";
import { readBldProfile, writeBldProfile } from "@/features/bld";
import { analyzeBldInBrowser, cancelSolverInBrowser, solveInBrowser, SolverCancelledError, SolverTimeoutError, validateStateInBrowser, warmSolverInBrowser, type BldResult, type CrossColor, type CubeValidation, type F2LSlot, type LastLayerMode, type OpeningMode, type SolverResult } from "@/lib/solverRuntime";

type CubeMotionKind = "idle" | "move" | "seek" | "phase" | "reset";
type CursorIntent = "step" | "playback" | "seek" | "phase" | "reset";

export default function Home() {
  const { language, t } = useLanguage();
  const [mode, setMode] = useState<SolverInputMode>("scramble");
  const [solverKind, setSolverKind] = useState<SolverKind>("cfop");
  const [crossColor, setCrossColor] = useState<CrossColor>(() => readSolverSettings().crossColor);
  const [opening, setOpening] = useState<OpeningMode>(() => readSolverSettings().opening);
  const [openingDepth, setOpeningDepth] = useState(() => readSolverSettings().openingDepth);
  const [openingFindResult, setOpeningFindResult] = useState(() => readSolverSettings().openingFindResult);
  const [directNodeBudget, setDirectNodeBudget] = useState(() => readSolverSettings().directNodeBudget);
  const [lastLayer, setLastLayer] = useState<LastLayerMode>(() => readSolverSettings().lastLayer);
  const [preferredSlot, setPreferredSlot] = useState<F2LSlot | undefined>(() => readSolverSettings().preferredSlot);
  const [excludedSlots, setExcludedSlots] = useState<F2LSlot[]>(() => readSolverSettings().excludedSlots);
  const [initialScramble] = useState(() => randomThreeByThreeScramble());
  const [value, setValue] = useState(initialScramble);
  const [savedScramble, setSavedScramble] = useState(initialScramble);
  const [savedState, setSavedState] = useState(SOLVED_STATE);
  const [result, setResult] = useState<SolverResult | null>(null);
  const [bldResult, setBldResult] = useState<BldResult | null>(null);
  const [bldProfile, setBldProfile] = useState(() => readBldProfile());
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);
  const [solverStatus, setSolverStatus] = useState("");
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [cubeMotion, setCubeMotion] = useState<{ id: number; kind: CubeMotionKind; direction: "forward" | "backward"; phaseName?: string }>({ id: 0, kind: "idle", direction: "forward" });
  const [cubeView, setCubeView] = useState<"2d" | "3d">("3d");
  const [error, setError] = useState("");
  const [stateValidation, setStateValidation] = useState<CubeValidation | null>(null);
  const [paintColor, setPaintColor] = useState<CrossColor>("U");
  const [recentStates, setRecentStates] = useState<RecentCubeState[]>(() => readRecentStates());
  useEffect(() => { warmSolverInBrowser().catch(() => undefined); }, []);
  useEffect(() => { writeBldProfile(bldProfile); }, [bldProfile]);
  const stateHistory = useRef<{ past: string[]; future: string[] }>({ past: [], future: [] });
  const cursorRef = useRef(0);
  const motionIdRef = useRef(0);
  const [, setStateHistoryVersion] = useState(0);

  const previewState = useMemo(() => {
    if (mode === "state") return stateValidation?.valid ? value : SOLVED_STATE;
    try { return value.trim() ? stateFromScramble(value) : SOLVED_STATE; } catch { return SOLVED_STATE; }
  }, [mode, value]);
  const currentState = useMemo(() => {
    if (!result) return previewState;
    return cursor === 0 ? result.initial_state : result.trace[cursor - 1]?.state ?? result.final_state;
  }, [cursor, previewState, result]);
  const previousState = useMemo(() => {
    if (!result || cursor === 0) return undefined;
    return cursor === 1 ? result.initial_state : result.trace[cursor - 2]?.state;
  }, [cursor, result]);
  const currentStep = result?.trace[cursor - 1];
  const activePhase = cursor > 0
    ? result?.phases.find((phase) => cursor > phase.start && cursor <= phase.end)
      ?? result?.phases.find((phase) => phase.end === cursor)
      ?? null
    : null;
  const totalMoves = result?.trace.length ?? 0;
  const openingTelemetry = result?.opening;
  const lastLayerTelemetry = result?.last_layer;
  const openingOutcome = useMemo(() => {
    const first = result?.phases[0];
    if (!first) return null;
    if (first.name.startsWith("xxxxcross_")) return { kind: "xxxxcross" as const, slots: first.name.slice("xxxxcross_".length).split("_"), moves: first.moves.length };
    if (first.name.startsWith("xxxcross_")) return { kind: "xxxcross" as const, slots: first.name.slice("xxxcross_".length).split("_"), moves: first.moves.length };
    if (first.name.startsWith("xxcross_")) return { kind: "xxcross" as const, slots: first.name.slice("xxcross_".length).split("_"), moves: first.moves.length };
    if (first.name.startsWith("xcross_")) return { kind: "xcross" as const, slot: first.name.slice("xcross_".length), moves: first.moves.length };
    return { kind: "cross" as const, slot: null, moves: first.moves.length };
  }, [result]);
  const activeXCrossSlots = activePhase?.name.startsWith("xxxxcross_") ? activePhase.name.slice("xxxxcross_".length).split("_") : activePhase?.name.startsWith("xxxcross_") ? activePhase.name.slice("xxxcross_".length).split("_") : activePhase?.name.startsWith("xxcross_") ? activePhase.name.slice("xxcross_".length).split("_") : activePhase?.name.startsWith("xcross_") ? [activePhase.name.slice("xcross_".length)] : undefined;
  const activeLastLayerCase = activePhase && (activePhase.name === "zbll" || activePhase.name === "1lll") && activePhase.case_id ? { family: activePhase.name, id: activePhase.case_id } : undefined;
  const phaseNameAt = useCallback((position: number) => {
    if (!result || position <= 0) return undefined;
    return result.phases.find((phase) => position > phase.start && position <= phase.end)?.name
      ?? result.phases.find((phase) => phase.end === position)?.name;
  }, [result]);
  const updateCursor = useCallback((next: number, intent: CursorIntent = "seek") => {
    const limit = result?.trace.length ?? 0;
    const target = Math.max(0, Math.min(limit, next));
    const previous = cursorRef.current;
    if (target === previous) return;
    const direction = target >= previous ? "forward" as const : "backward" as const;
    const fromPhase = phaseNameAt(previous);
    const toPhase = phaseNameAt(target);
    const distance = Math.abs(target - previous);
    const kind: CubeMotionKind = intent === "reset" || target === 0 ? "reset" : intent === "phase" || (distance > 1 && fromPhase !== toPhase) ? "phase" : distance === 1 ? "move" : "seek";
    cursorRef.current = target;
    setCubeMotion({ id: ++motionIdRef.current, kind, direction, phaseName: toPhase });
    setCursor(target);
  }, [phaseNameAt, result]);

  useEffect(() => {
    if (!playing || !result) return;
    const id = window.setInterval(() => {
      const next = cursorRef.current + 1;
      if (next > result.trace.length) { setPlaying(false); return; }
      updateCursor(next, "playback");
    }, Math.max(100, Math.round(360 / playbackSpeed)));
    return () => window.clearInterval(id);
  }, [playbackSpeed, playing, result, updateCursor]);

  useEffect(() => {
    if (mode !== "state") { setStateValidation(null); return; }
    const candidate = value.trim();
    if (candidate.length !== 54) { setStateValidation({ valid: false, message: t("home.incompleteState") }); return; }
    let active = true;
    const timer = window.setTimeout(() => {
      validateStateInBrowser(candidate).then((validation) => { if (active) setStateValidation(validation); }).catch((reason) => { if (active) setStateValidation({ valid: false, message: reason instanceof Error ? reason.message : "Validation failed." }); });
    }, 280);
    return () => { active = false; window.clearTimeout(timer); };
  }, [language, mode, value]);

  async function runSolver() {
    if (mode === "state" && !stateValidation?.valid) { setError(stateValidation?.message ?? (t("home.validatingState"))); return; }
    setLoading(true);
    setPlaying(false);
    setError("");
    setSolverStatus(t("home.preparing"));
    try {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      if (solverKind === "bld") {
        setSolverStatus(t("home.buildingMemo"));
        const next = await analyzeBldInBrowser(mode, value.trim());
        setBldResult(next);
        setResult(null);
        cursorRef.current = 0;
        setCubeMotion({ id: ++motionIdRef.current, kind: "reset", direction: "forward" });
        setCursor(0);
        if (mode === "state") saveRecentState(value.trim(), crossColor);
        return;
      }
      setSolverStatus(t("home.searching", { opening: openingModeLabel(opening, language) }));
      const next = await solveInBrowser(mode, value.trim(), crossColor, opening, { preferredSlot, excludedSlots }, lastLayer, openingDepth, openingFindResult, directNodeBudget);
      setResult(next);
      setBldResult(null);
      cursorRef.current = 0;
      setCubeMotion({ id: ++motionIdRef.current, kind: "reset", direction: "forward" });
      setCursor(0);
      if (mode === "state") saveRecentState(value.trim(), crossColor);
    } catch (reason) {
      if (reason instanceof SolverCancelledError) setError(t("home.solverCancelled"));
      else if (reason instanceof SolverTimeoutError) setError(t("home.solverTimeout"));
      else setError(reason instanceof Error ? reason.message : t("home.solverFailedDetail"));
    } finally {
      setLoading(false);
      setSolverStatus("");
    }
  }

  const cancelSolver = () => {
    cancelSolverInBrowser();
    setLoading(false);
    setSolverStatus("");
    setError(t("home.solverCancelled"));
  };

  const saveRecentState = (state: string, color: CrossColor) => {
    const next = rememberRecentState(recentStates, state, color, language);
    setRecentStates(next);
    writeRecentStates(next);
  };
  const loadRecentState = (item: RecentCubeState) => { stateHistory.current = { past: [], future: [] }; setStateHistoryVersion((version) => version + 1); setMode("state"); setValue(item.state); setSavedState(item.state); setCrossColor(item.crossColor); setResult(null); setBldResult(null); setCursor(0); setError(""); };
  const removeRecentState = (id: string) => { const next = recentStates.filter((item) => item.id !== id); setRecentStates(next); writeRecentStates(next); };
  const selectCursor = (next: number, intent: CursorIntent = "seek") => { setPlaying(false); updateCursor(next, intent); };
  const applyStateEdit = (next: string) => {
    const current = value.length === 54 ? value : SOLVED_STATE;
    if (next === current) return;
    stateHistory.current.past = [...stateHistory.current.past, current].slice(-80);
    stateHistory.current.future = [];
    setValue(next);
    setSavedState(next);
    setStateHistoryVersion((version) => version + 1);
    setResult(null);
    setBldResult(null);
    setCursor(0);
    setError("");
  };
  const undoStateEdit = () => {
    const previous = stateHistory.current.past.at(-1);
    if (!previous) return;
    const current = value.length === 54 ? value : SOLVED_STATE;
    stateHistory.current.past = stateHistory.current.past.slice(0, -1);
    stateHistory.current.future = [...stateHistory.current.future, current].slice(-80);
    setValue(previous);
    setSavedState(previous);
    setBldResult(null);
    setStateHistoryVersion((version) => version + 1);
  };
  const redoStateEdit = () => {
    const next = stateHistory.current.future.at(-1);
    if (!next) return;
    const current = value.length === 54 ? value : SOLVED_STATE;
    stateHistory.current.future = stateHistory.current.future.slice(0, -1);
    stateHistory.current.past = [...stateHistory.current.past, current].slice(-80);
    setValue(next);
    setSavedState(next);
    setBldResult(null);
    setStateHistoryVersion((version) => version + 1);
  };
  const switchInputMode = (next: SolverInputMode) => {
    if (next === mode) return;
    if (mode === "scramble") setSavedScramble(value); else setSavedState(value);
    setMode(next);
    setValue(next === "scramble" ? savedScramble : savedState);
    setResult(null);
    setBldResult(null);
    setCursor(0);
    setPlaying(false);
    setError("");
  };
  const switchSolverKind = (next: SolverKind) => {
    if (next === solverKind) return;
    setSolverKind(next);
    setResult(null);
    setBldResult(null);
    setCursor(0);
    setPlaying(false);
    setError("");
  };
  const resetDefaults = () => {
    const defaults = readSolverSettings();
    setCrossColor(defaults.crossColor);
    setOpening(defaults.opening);
    setOpeningDepth(defaults.openingDepth);
    setOpeningFindResult(defaults.openingFindResult);
    setDirectNodeBudget(defaults.directNodeBudget);
    setLastLayer(defaults.lastLayer);
    setPreferredSlot(defaults.preferredSlot);
    setExcludedSlots(defaults.excludedSlots);
  };
  const randomScramble = () => {
    const next = randomThreeByThreeScramble();
    setValue(next);
    setSavedScramble(next);
    setResult(null);
    setBldResult(null);
    setCursor(0);
    setError("");
  };
  const applyCameraState = (state: string) => {
    stateHistory.current = { past: [], future: [] };
    setStateHistoryVersion((version) => version + 1);
    setMode("state");
    setValue(state);
    setSavedState(state);
    setResult(null);
    setBldResult(null);
    setCursor(0);
    setError("");
  };

  const hasResult = Boolean(result);
  const stage = solverKind === "bld" ? (bldResult?.initial_state ?? currentState) : currentState;
  const solutionTitle = solverKind === "bld" ? (bldResult ? t("home.memoReady") : t("home.memoBuild")) : activePhase ? simplePhase(activePhase.name, language) : t("home.solutionTitle");
  const solutionSubtitle = solverKind === "bld" ? (bldResult ? t("home.memoSeparated") : t("home.memoStudioOnly")) : currentStep ? `${t("guide.move")}: ${currentStep.move}` : hasResult ? t("home.solutionReady") : t("guide.help");
  const solutionMove = solverKind === "bld" ? (bldResult ? `${bldResult.analysis.edges.memo.length} / ${bldResult.analysis.corners.memo.length}` : "—") : currentStep?.move ?? "—";

  return (
    <main className="min-vh-100 bg-body-tertiary">
      <div className="container-fluid px-3 px-lg-5 py-3 py-lg-4">
        <section className="rounded-4 bg-primary-subtle shadow-sm px-4 px-lg-5 py-4 py-lg-5 mb-4">
          <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
            <span className="badge rounded-pill text-primary-emphasis bg-primary bg-opacity-10 px-3 py-2">{t("home.eyebrow")}</span>
            <Link href="/timer" className="btn btn-light border rounded-pill px-3"><Timer className="fs-6 me-1" />{t("timer.title")} <span aria-hidden="true">→</span></Link>
          </div>
          <h1 className="display-4 fw-bold mb-2">{solverKind === "bld" ? t("home.title.bld") : t("home.title.solve")}</h1>
          <p className="lead text-body-secondary mb-0">{solverKind === "bld" ? t("home.description.bld") : mode === "state" ? t("home.description.state") : t("home.description.solve")}</p>
          <div className="border-top border-primary border-opacity-25 mt-4 pt-3">
            <SolverToolbar
              solverKind={solverKind}
              onSolverKindChange={switchSolverKind}
              mode={mode}
              onModeChange={switchInputMode}
              loading={loading}
              status={solverStatus}
              hint={t("home.hint")}
              onResetDefaults={resetDefaults}
            />
          </div>
        </section>

        <div className="row g-4 align-items-start">
          <div className="col-12 col-xl-8">
            <SolverInputPanel
              solverKind={solverKind}
              mode={mode}
              value={value}
              loading={loading}
              status={solverStatus}
              error={error}
              stateValidation={stateValidation}
              paintColor={paintColor}
              canUndo={stateHistory.current.past.length > 0}
              canRedo={stateHistory.current.future.length > 0}
              recentStates={recentStates}
              onValueChange={(next) => { setValue(next); setSavedScramble(next); setBldResult(null); }}
              onStateEdit={applyStateEdit}
              onUndo={undoStateEdit}
              onRedo={redoStateEdit}
              onPaintColorChange={setPaintColor}
              onRandomScramble={randomScramble}
              onSolve={() => void runSolver()}
              onCancel={cancelSolver}
              onSelectRecentState={loadRecentState}
              onRemoveRecentState={removeRecentState}
              onCameraState={applyCameraState}
              advancedOptions={opening !== "cross" && opening !== "xxxxcross" ? (
                <SolverF2LOptions preferredSlot={preferredSlot} excludedSlots={excludedSlots} onPreferredSlotChange={setPreferredSlot} onExcludedSlotsChange={setExcludedSlots} />
              ) : null}
            />

            <SolverSolutionPanel
              view={cubeView}
              onViewChange={setCubeView}
              title={solutionTitle}
              subtitle={solutionSubtitle}
              eyebrow={solverKind === "bld" ? "3-STYLE · MEMO" : hasResult ? `${t("guide.step")} · ${String(cursor).padStart(2, "0")} / ${String(totalMoves).padStart(2, "0")}` : undefined}
              move={solutionMove}
              moveLabel={solverKind === "bld" ? t("home.edgesCorners") : t("guide.move")}
              turnCount={totalMoves}
              hasResult={hasResult}
              cursor={cursor}
              playing={playing}
              playbackSpeed={playbackSpeed}
              onTogglePlay={() => setPlaying((value) => !value)}
              onStep={(delta) => selectCursor(cursor + delta, "step")}
              onReset={() => selectCursor(0, "reset")}
              onSeek={(next) => selectCursor(next, "seek")}
              onPlaybackSpeedChange={setPlaybackSpeed}
            >
              {cubeView === "2d" ? (
                <CubeNet state={solverKind === "bld" ? (bldResult?.initial_state ?? currentState) : mode === "state" ? (value.length === 54 ? value : SOLVED_STATE) : currentState} editable={mode === "state" && solverKind !== "bld"} selectedColor={paintColor} onStateChange={applyStateEdit} disabled={loading} emphasis="studio" />
              ) : (
                <Cube3DGuide state={stage} previousState={previousState} move={solverKind === "bld" ? undefined : currentStep?.move} step={cursor} crossColor={crossColor} alignCross xcrossSlots={activeXCrossSlots} lastLayerCase={activeLastLayerCase} transition={cubeMotion.kind} transitionDirection={cubeMotion.direction} transitionId={cubeMotion.id} phaseLabel={cubeMotion.phaseName ? simplePhase(cubeMotion.phaseName, language) : undefined} turnDurationMs={playing ? Math.max(120, Math.round(280 / playbackSpeed)) : 340} surface="light" />
              )}
            </SolverSolutionPanel>

            {solverKind !== "bld" && openingOutcome ? <div className={`alert ${openingTelemetry?.did_fallback ? "alert-warning" : "alert-success"} rounded-4 mt-3 mb-0`}><strong>{t("home.firstSteps")}</strong> {t("home.turns", { count: openingOutcome.moves })}{openingTelemetry?.did_fallback ? ` · ${t("home.autoFallback")}` : ""}</div> : null}
            {solverKind !== "bld" && lastLayerTelemetry ? <div className={`alert ${lastLayerTelemetry.did_fallback ? "alert-warning" : "alert-success"} rounded-4 mt-3 mb-0`}><strong>{t("home.finalPart")}</strong> {lastLayerModeLabel(lastLayerTelemetry.achieved, language)}</div> : null}
          </div>

          <aside className="col-12 col-xl-4">
            <section className="card border-0 shadow-sm rounded-4 overflow-hidden sticky-top" aria-label={t("home.solutionTitle")}>
              <div className="card-header bg-body border-0 d-flex align-items-center justify-content-between px-4 pt-4">
                <div><p className="small text-primary mb-1">{t("home.solutionStepsEyebrow")}</p><h2 className="h4 mb-0">{t("home.solutionTitle")}</h2></div>
                <span className="badge rounded-pill text-bg-light">{solverKind === "bld" ? "3-STYLE" : "CFOP"}</span>
              </div>
              <div className="card-body px-4 pb-4">
                <div className="btn-group w-100 mb-3" role="group" aria-label={t("home.modeLabel")}>
                  <button type="button" className={solverKind === "cfop" ? "btn btn-primary" : "btn btn-outline-secondary"} aria-pressed={solverKind === "cfop"} onClick={() => switchSolverKind("cfop")}>CFOP</button>
                  <button type="button" className={solverKind === "bld" ? "btn btn-primary" : "btn btn-outline-secondary"} aria-pressed={solverKind === "bld"} onClick={() => switchSolverKind("bld")}>BLD</button>
                </div>
                {solverKind === "bld" && bldResult ? <BldReport result={bldResult} language={language} profile={bldProfile} onProfile={setBldProfile} /> : result ? <CfopReport result={result} language={language} activePhase={activePhase?.name ?? null} cursor={cursor} onSelectPhase={(phase) => selectCursor(phase.end, "phase")} onSelectMove={(moveIndex) => selectCursor(moveIndex, "seek")} /> : <div className="text-center bg-body-tertiary rounded-4 p-4"><p className="fw-semibold mb-0">{t("home.noSolutionYet")}</p></div>}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
