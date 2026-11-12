/**
 * Giải Rubik dashboard: blue pill-shaped controls, soft white cards, the cube
 * stage with a player on the left and the numbered CFOP solution on the right.
 * Styles and reusable pieces live in styles/design-system.css and components/ui/DesignSystem.tsx.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BoxSeam,
  CheckCircleFill,
  ChevronUp,
  ListUl,
  Puzzle,
} from "@/components/ui/Icon";
import {
  Banner,
  EyebrowPill,
  PanelHeader,
  PillTabs,
  RoundButton,
  Surface,
} from "@/components/ui/DesignSystem";
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
import {
  analyzeBldInBrowser,
  cancelSolverInBrowser,
  solveInBrowser,
  SolverCancelledError,
  SolverLimitError,
  SolverTimeoutError,
  validateStateInBrowser,
  warmSolverInBrowser,
  type BldResult,
  type CrossColor,
  type CubeValidation,
  type F2LSlot,
  type LastLayerMode,
  type OpeningMode,
  type SolverResult,
} from "@/lib/solverRuntime";

type CubeMotionKind = "idle" | "move" | "seek" | "phase" | "reset";
type CursorIntent = "step" | "playback" | "seek" | "phase" | "reset";

export default function Home() {
  const { language, t } = useLanguage();
  const [mode, setMode] = useState<SolverInputMode>("scramble");
  const [solverKind, setSolverKind] = useState<SolverKind>("cfop");
  const [crossColor, setCrossColor] = useState<CrossColor>(
    () => readSolverSettings().crossColor
  );
  const [opening, setOpening] = useState<OpeningMode>(
    () => readSolverSettings().opening
  );
  const [openingDepth, setOpeningDepth] = useState(
    () => readSolverSettings().openingDepth
  );
  const [openingFindResult, setOpeningFindResult] = useState(
    () => readSolverSettings().openingFindResult
  );
  const [directNodeBudget, setDirectNodeBudget] = useState(
    () => readSolverSettings().directNodeBudget
  );
  const [lastLayer, setLastLayer] = useState<LastLayerMode>(
    () => readSolverSettings().lastLayer
  );
  const [preferredSlot, setPreferredSlot] = useState<F2LSlot | undefined>(
    () => readSolverSettings().preferredSlot
  );
  const [excludedSlots, setExcludedSlots] = useState<F2LSlot[]>(
    () => readSolverSettings().excludedSlots
  );
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
  const [cubeMotion, setCubeMotion] = useState<{
    id: number;
    kind: CubeMotionKind;
    direction: "forward" | "backward";
    phaseName?: string;
  }>({ id: 0, kind: "idle", direction: "forward" });
  const [cubeView, setCubeView] = useState<"2d" | "3d">("3d");
  const [error, setError] = useState("");
  const [solutionOpen, setSolutionOpen] = useState(true);
  const [stateValidation, setStateValidation] = useState<CubeValidation | null>(
    null
  );
  const [paintColor, setPaintColor] = useState<CrossColor>("U");
  const [recentStates, setRecentStates] = useState<RecentCubeState[]>(() =>
    readRecentStates()
  );
  useEffect(() => {
    warmSolverInBrowser().catch(() => undefined);
  }, []);
  useEffect(() => {
    writeBldProfile(bldProfile);
  }, [bldProfile]);
  const stateHistory = useRef<{ past: string[]; future: string[] }>({
    past: [],
    future: [],
  });
  const cursorRef = useRef(0);
  const motionIdRef = useRef(0);
  const [, setStateHistoryVersion] = useState(0);

  const previewState = useMemo(() => {
    if (mode === "state") return stateValidation?.valid ? value : SOLVED_STATE;
    try {
      return value.trim() ? stateFromScramble(value) : SOLVED_STATE;
    } catch {
      return SOLVED_STATE;
    }
  }, [mode, value]);
  const currentState = useMemo(() => {
    if (!result) return previewState;
    return cursor === 0
      ? result.initial_state
      : (result.trace[cursor - 1]?.state ?? result.final_state);
  }, [cursor, previewState, result]);
  const previousState = useMemo(() => {
    if (!result || cursor === 0) return undefined;
    return cursor === 1
      ? result.initial_state
      : result.trace[cursor - 2]?.state;
  }, [cursor, result]);
  const currentStep = result?.trace[cursor - 1];
  const activePhase =
    cursor > 0
      ? (result?.phases.find(
          phase => cursor > phase.start && cursor <= phase.end
        ) ??
        result?.phases.find(phase => phase.end === cursor) ??
        null)
      : null;
  const totalMoves = result?.trace.length ?? 0;
  const openingTelemetry = result?.opening;
  const lastLayerTelemetry = result?.last_layer;
  const openingOutcome = useMemo(() => {
    const first = result?.phases[0];
    if (!first) return null;
    if (first.name.startsWith("xxxxcross_"))
      return {
        kind: "xxxxcross" as const,
        slots: first.name.slice("xxxxcross_".length).split("_"),
        moves: first.moves.length,
      };
    if (first.name.startsWith("xxxcross_"))
      return {
        kind: "xxxcross" as const,
        slots: first.name.slice("xxxcross_".length).split("_"),
        moves: first.moves.length,
      };
    if (first.name.startsWith("xxcross_"))
      return {
        kind: "xxcross" as const,
        slots: first.name.slice("xxcross_".length).split("_"),
        moves: first.moves.length,
      };
    if (first.name.startsWith("xcross_"))
      return {
        kind: "xcross" as const,
        slot: first.name.slice("xcross_".length),
        moves: first.moves.length,
      };
    return { kind: "cross" as const, slot: null, moves: first.moves.length };
  }, [result]);
  const activeXCrossSlots = activePhase?.name.startsWith("xxxxcross_")
    ? activePhase.name.slice("xxxxcross_".length).split("_")
    : activePhase?.name.startsWith("xxxcross_")
      ? activePhase.name.slice("xxxcross_".length).split("_")
      : activePhase?.name.startsWith("xxcross_")
        ? activePhase.name.slice("xxcross_".length).split("_")
        : activePhase?.name.startsWith("xcross_")
          ? [activePhase.name.slice("xcross_".length)]
          : undefined;
  const activeLastLayerCase =
    activePhase &&
    (activePhase.name === "zbll" || activePhase.name === "1lll") &&
    activePhase.case_id
      ? { family: activePhase.name, id: activePhase.case_id }
      : undefined;
  const phaseNameAt = useCallback(
    (position: number) => {
      if (!result || position <= 0) return undefined;
      return (
        result.phases.find(
          phase => position > phase.start && position <= phase.end
        )?.name ?? result.phases.find(phase => phase.end === position)?.name
      );
    },
    [result]
  );
  const updateCursor = useCallback(
    (next: number, intent: CursorIntent = "seek") => {
      const limit = result?.trace.length ?? 0;
      const target = Math.max(0, Math.min(limit, next));
      const previous = cursorRef.current;
      if (target === previous) return;
      const direction =
        target >= previous ? ("forward" as const) : ("backward" as const);
      const fromPhase = phaseNameAt(previous);
      const toPhase = phaseNameAt(target);
      const distance = Math.abs(target - previous);
      const kind: CubeMotionKind =
        intent === "reset" || target === 0
          ? "reset"
          : intent === "phase" || (distance > 1 && fromPhase !== toPhase)
            ? "phase"
            : distance === 1
              ? "move"
              : "seek";
      cursorRef.current = target;
      setCubeMotion({
        id: ++motionIdRef.current,
        kind,
        direction,
        phaseName: toPhase,
      });
      setCursor(target);
    },
    [phaseNameAt, result]
  );

  useEffect(() => {
    if (!playing || !result) return;
    const id = window.setInterval(
      () => {
        const next = cursorRef.current + 1;
        if (next > result.trace.length) {
          setPlaying(false);
          return;
        }
        updateCursor(next, "playback");
      },
      Math.max(100, Math.round(360 / playbackSpeed))
    );
    return () => window.clearInterval(id);
  }, [playbackSpeed, playing, result, updateCursor]);

  useEffect(() => {
    if (mode !== "state") {
      setStateValidation(null);
      return;
    }
    const candidate = value.trim();
    if (candidate.length !== 54) {
      setStateValidation({ valid: false, message: t("home.incompleteState") });
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      validateStateInBrowser(candidate)
        .then(validation => {
          if (active) setStateValidation(validation);
        })
        .catch(reason => {
          if (active)
            setStateValidation({
              valid: false,
              message:
                reason instanceof Error ? reason.message : "Validation failed.",
            });
        });
    }, 280);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [language, mode, value]);

  async function runSolver() {
    if (mode === "state" && !stateValidation?.valid) {
      setError(stateValidation?.message ?? t("home.validatingState"));
      return;
    }
    setLoading(true);
    setPlaying(false);
    setError("");
    setSolverStatus(t("home.preparing"));
    try {
      await new Promise<void>(resolve =>
        window.requestAnimationFrame(() => resolve())
      );
      if (solverKind === "bld") {
        setSolverStatus(t("home.buildingMemo"));
        const next = await analyzeBldInBrowser(mode, value.trim());
        setBldResult(next);
        setResult(null);
        cursorRef.current = 0;
        setCubeMotion({
          id: ++motionIdRef.current,
          kind: "reset",
          direction: "forward",
        });
        setCursor(0);
        if (mode === "state") saveRecentState(value.trim(), crossColor);
        return;
      }
      setSolverStatus(
        t("home.searching", { opening: openingModeLabel(opening, language) })
      );
      const next = await solveInBrowser(
        mode,
        value.trim(),
        crossColor,
        opening,
        { preferredSlot, excludedSlots },
        lastLayer,
        openingDepth,
        openingFindResult,
        directNodeBudget
      );
      setResult(next);
      setBldResult(null);
      cursorRef.current = 0;
      setCubeMotion({
        id: ++motionIdRef.current,
        kind: "reset",
        direction: "forward",
      });
      setCursor(0);
      if (mode === "state") saveRecentState(value.trim(), crossColor);
    } catch (reason) {
      if (reason instanceof SolverCancelledError)
        setError(t("home.solverCancelled"));
      else if (reason instanceof SolverTimeoutError)
        setError(t("home.solverTimeout"));
      else if (reason instanceof SolverLimitError)
        setError(t("home.solverLimit"));
      else
        setError(
          reason instanceof Error
            ? reason.message
            : t("home.solverFailedDetail")
        );
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
  const loadRecentState = (item: RecentCubeState) => {
    stateHistory.current = { past: [], future: [] };
    setStateHistoryVersion(version => version + 1);
    setMode("state");
    setValue(item.state);
    setSavedState(item.state);
    setCrossColor(item.crossColor);
    setResult(null);
    setBldResult(null);
    setCursor(0);
    setError("");
  };
  const removeRecentState = (id: string) => {
    const next = recentStates.filter(item => item.id !== id);
    setRecentStates(next);
    writeRecentStates(next);
  };
  const selectCursor = (next: number, intent: CursorIntent = "seek") => {
    setPlaying(false);
    updateCursor(next, intent);
  };
  const applyStateEdit = (next: string) => {
    const current = value.length === 54 ? value : SOLVED_STATE;
    if (next === current) return;
    stateHistory.current.past = [...stateHistory.current.past, current].slice(
      -80
    );
    stateHistory.current.future = [];
    setValue(next);
    setSavedState(next);
    setStateHistoryVersion(version => version + 1);
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
    stateHistory.current.future = [
      ...stateHistory.current.future,
      current,
    ].slice(-80);
    setValue(previous);
    setSavedState(previous);
    setBldResult(null);
    setStateHistoryVersion(version => version + 1);
  };
  const redoStateEdit = () => {
    const next = stateHistory.current.future.at(-1);
    if (!next) return;
    const current = value.length === 54 ? value : SOLVED_STATE;
    stateHistory.current.future = stateHistory.current.future.slice(0, -1);
    stateHistory.current.past = [...stateHistory.current.past, current].slice(
      -80
    );
    setValue(next);
    setSavedState(next);
    setBldResult(null);
    setStateHistoryVersion(version => version + 1);
  };
  const switchInputMode = (next: SolverInputMode) => {
    if (next === mode) return;
    if (mode === "scramble") setSavedScramble(value);
    else setSavedState(value);
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
    setStateHistoryVersion(version => version + 1);
    setMode("state");
    setValue(state);
    setSavedState(state);
    setResult(null);
    setBldResult(null);
    setCursor(0);
    setError("");
  };

  const hasResult = Boolean(result);
  const stage =
    solverKind === "bld"
      ? (bldResult?.initial_state ?? currentState)
      : currentState;
  const solutionTitle =
    solverKind === "bld"
      ? bldResult
        ? t("home.memoReady")
        : t("home.memoBuild")
      : activePhase
        ? simplePhase(activePhase.name, language)
        : t("home.solutionTitle");
  const solutionSubtitle =
    solverKind === "bld"
      ? bldResult
        ? t("home.memoSeparated")
        : t("home.memoStudioOnly")
      : currentStep
        ? `${t("guide.move")}: ${currentStep.move}`
        : hasResult
          ? t("home.solutionReady")
          : t("guide.help");
  const solutionMove =
    solverKind === "bld"
      ? bldResult
        ? `${bldResult.analysis.edges.memo.length} / ${bldResult.analysis.corners.memo.length}`
        : "—"
      : (currentStep?.move ?? "—");

  const heroCube = (
    <svg
      className="absolute hidden lg:block"
      style={{ right: "6%", top: "-0.5rem", width: 190, height: 190 }}
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      <polygon points="60,8 108,34 60,60 12,34" fill="#ffd95a" />
      <polygon points="12,34 60,60 60,112 12,86" fill="#2f6df6" />
      <polygon points="108,34 60,60 60,112 108,86" fill="#ef5b45" />
      <g stroke="rgba(20,28,60,.35)" strokeWidth="1.6" fill="none">
        <path d="M44 16.7 92 42.7M28 25.3 76 51.3M36 73 36 107M24 80 24 98M84 73 84 107M96 80 96 98" />
        <path d="M12 34 60 60 108 34M60 60 60 112" />
      </g>
    </svg>
  );
  const firstStepsBanner =
    solverKind !== "bld" && openingOutcome ? (
      <Banner
        tone={openingTelemetry?.did_fallback ? "warning" : "success"}
        icon={<CheckCircleFill aria-hidden="true" />}
      >
        <strong>{t("home.firstSteps")}</strong>{" "}
        {t("home.turns", { count: openingOutcome.moves })}
        {openingTelemetry?.did_fallback ? ` · ${t("home.autoFallback")}` : ""}
      </Banner>
    ) : null;

  return (
    <div className="mx-auto w-full max-w-[88rem] px-4 sm:px-6 lg:px-8 lg:px-6 pb-6 lg:pb-12">
      <section className="relative my-6">
        {heroCube}
        <EyebrowPill className="mb-4" icon={<BoxSeam aria-hidden="true" />}>
          {t("home.eyebrow")}
        </EyebrowPill>
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-2">
              {solverKind === "bld"
                ? t("home.title.bld")
                : t("home.title.solve")}
            </h1>
            <p className="mb-0 text-muted">
              {solverKind === "bld"
                ? t("home.description.bld")
                : mode === "state"
                  ? t("home.description.state")
                  : t("home.description.solve")}
            </p>
          </div>
          <SolverToolbar
            solverKind={solverKind}
            onSolverKindChange={switchSolverKind}
            mode={mode}
            onModeChange={switchInputMode}
            loading={loading}
            status={solverStatus}
          />
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
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
            onValueChange={next => {
              setValue(next);
              setSavedScramble(next);
              setBldResult(null);
            }}
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
            onResetDefaults={resetDefaults}
            advancedOptions={
              opening !== "cross" && opening !== "xxxxcross" ? (
                <SolverF2LOptions
                  preferredSlot={preferredSlot}
                  excludedSlots={excludedSlots}
                  onPreferredSlotChange={setPreferredSlot}
                  onExcludedSlotsChange={setExcludedSlots}
                />
              ) : null
            }
          />

          <div>
            <SolverSolutionPanel
              view={cubeView}
              onViewChange={setCubeView}
              title={solutionTitle}
              subtitle={solutionSubtitle}
              eyebrow={
                solverKind === "bld"
                  ? "3-STYLE · MEMO"
                  : hasResult
                    ? `${t("guide.step")} · ${String(cursor).padStart(2, "0")} / ${String(totalMoves).padStart(2, "0")}`
                    : undefined
              }
              move={solutionMove}
              moveLabel={
                solverKind === "bld" ? t("home.edgesCorners") : t("guide.move")
              }
              turnCount={totalMoves}
              hasResult={hasResult}
              cursor={cursor}
              playing={playing}
              playbackSpeed={playbackSpeed}
              onTogglePlay={() => setPlaying(value => !value)}
              onStep={delta => selectCursor(cursor + delta, "step")}
              onReset={() => selectCursor(0, "reset")}
              onSeek={next => selectCursor(next, "seek")}
              onPlaybackSpeedChange={setPlaybackSpeed}
              footer={firstStepsBanner}
            >
              {cubeView === "2d" ? (
                <CubeNet
                  state={
                    solverKind === "bld"
                      ? (bldResult?.initial_state ?? currentState)
                      : mode === "state"
                        ? value.length === 54
                          ? value
                          : SOLVED_STATE
                        : currentState
                  }
                  editable={mode === "state" && solverKind !== "bld"}
                  selectedColor={paintColor}
                  onStateChange={applyStateEdit}
                  disabled={loading}
                />
              ) : (
                <Cube3DGuide
                  state={stage}
                  previousState={previousState}
                  move={solverKind === "bld" ? undefined : currentStep?.move}
                  step={cursor}
                  crossColor={crossColor}
                  alignCross
                  xcrossSlots={activeXCrossSlots}
                  lastLayerCase={activeLastLayerCase}
                  transition={cubeMotion.kind}
                  transitionDirection={cubeMotion.direction}
                  transitionId={cubeMotion.id}
                  phaseLabel={
                    cubeMotion.phaseName
                      ? simplePhase(cubeMotion.phaseName, language)
                      : undefined
                  }
                  turnDurationMs={
                    playing
                      ? Math.max(120, Math.round(280 / playbackSpeed))
                      : 340
                  }
                  surface="light"
                />
              )}
            </SolverSolutionPanel>
            {solverKind !== "bld" && lastLayerTelemetry ? (
              <Banner
                className="mt-4"
                tone={lastLayerTelemetry.did_fallback ? "warning" : "success"}
                icon={<CheckCircleFill aria-hidden="true" />}
              >
                <strong>{t("home.finalPart")}</strong>{" "}
                {lastLayerModeLabel(lastLayerTelemetry.achieved, language)}
              </Banner>
            ) : null}
          </div>
        </div>

        <aside className="col-span-12 xl:col-span-4">
          <Surface
            className="p-4 lg:p-6 xl:sticky"
            style={{ top: "6rem" }}
            aria-label={t("home.solutionTitle")}
          >
            <PanelHeader
              className="mb-4"
              icon={<ListUl />}
              title={t("home.solutionTitle")}
              actions={
                <RoundButton
                  tone="plain"
                  size="sm"
                  label={t("home.toggleSolution")}
                  aria-expanded={solutionOpen}
                  onClick={() => setSolutionOpen(open => !open)}
                  icon={
                    <ChevronUp
                      style={{
                        transform: solutionOpen ? "none" : "rotate(180deg)",
                        transition: "transform .15s",
                      }}
                    />
                  }
                />
              }
            />
            {solutionOpen ? (
              <>
                <PillTabs<SolverKind>
                  variant="soft"
                  fill
                  className="mb-4"
                  label={t("home.modeLabel")}
                  value={solverKind}
                  onChange={switchSolverKind}
                  options={[
                    {
                      value: "cfop",
                      label: "CFOP",
                      icon: <BoxSeam aria-hidden="true" />,
                    },
                    {
                      value: "bld",
                      label: "BLD",
                      icon: <Puzzle aria-hidden="true" />,
                    },
                  ]}
                />
                {solverKind === "bld" && bldResult ? (
                  <BldReport
                    result={bldResult}
                    language={language}
                    profile={bldProfile}
                    onProfile={setBldProfile}
                  />
                ) : result ? (
                  <CfopReport
                    result={result}
                    language={language}
                    activePhase={activePhase?.name ?? null}
                    cursor={cursor}
                    onSelectPhase={phase => selectCursor(phase.end, "phase")}
                    onSelectMove={moveIndex => selectCursor(moveIndex, "seek")}
                  />
                ) : (
                  <div className="rounded-2xl bg-primary-soft p-6 text-center">
                    <p className="font-semibold mb-0">
                      {t("home.noSolutionYet")}
                    </p>
                  </div>
                )}
              </>
            ) : null}
          </Surface>
        </aside>
      </div>
    </div>
  );
}
