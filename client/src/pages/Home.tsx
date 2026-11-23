/**
 * Trang giải Rubik — phong cách mềm mại, tối giản: không viền, không bóng,
 * chỉ hiệu ứng hover cơ bản. Hai cột: nhập scramble + khối 3D bên trái, lời
 * giải từng bước bên phải.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { CubeNet, SOLVED_STATE } from "@/components/common/CubeNet";
import { Cube3DGuide } from "@/components/common/Cube3DGuide";
import { BldReport } from "@/features/bld";
import {
  CfopReport,
  LastLayerOutcomeBanner,
  OpeningOutcomeBanner,
  SolverF2LOptions,
  SolverInputPanel,
  SolverSolutionPanel,
  SolverSolutionSidebar,
  SolverToolbar,
  lastLayerCaseOf,
  openingOutcomeOf,
  phaseAt,
  readRecentStates,
  rememberRecentState,
  writeRecentStates,
  type RecentCubeState,
  type SolverInputMode,
  type SolverKind,
  useSolverPlayback,
  useSolverSettingsState,
  useStateValidation,
  xcrossSlotsOf,
} from "@/features/solver";
import { stateFromScramble } from "@/lib/fastCube";
import {
  heldNotationResult,
  orientForCross,
  scrambledState,
  solutionSetupRotation,
  wcaLettersToStudio,
} from "@/lib/scrambleOrientation";
import { simplePhase, useLanguage } from "@/contexts/LanguageContext";
import { randomThreeByThreeScramble } from "@/lib/cubeScramble";
import { openingModeLabel } from "@/features/solver/lib/solverPresentation";
import { readBldProfile, writeBldProfile } from "@/features/bld";
import {
  analyzeBldInBrowser,
  cancelSolverInBrowser,
  solveInBrowser,
  SolverCancelledError,
  SolverLimitError,
  SolverTimeoutError,
  warmSolverInBrowser,
  type BldResult,
  type CrossColor,
  type SolverResult,
} from "@/lib/solverRuntime";

export default function Home() {
  const { language, t } = useLanguage();
  const [mode, setMode] = useState<SolverInputMode>("scramble");
  const [solverKind, setSolverKind] = useState<SolverKind>("cfop");
  const {
    crossColor,
    setCrossColor,
    opening,
    openingDepth,
    openingFindResult,
    directNodeBudget,
    lastLayer,
    preferredSlot,
    setPreferredSlot,
    excludedSlots,
    setExcludedSlots,
    resetDefaults,
  } = useSolverSettingsState();
  const [initialScramble] = useState(() => randomThreeByThreeScramble());
  const [value, setValue] = useState(initialScramble);
  const [savedScramble, setSavedScramble] = useState(initialScramble);
  const [savedState, setSavedState] = useState(SOLVED_STATE);
  const [result, setResult] = useState<SolverResult | null>(null);
  const [bldResult, setBldResult] = useState<BldResult | null>(null);
  const [bldProfile, setBldProfile] = useState(() => readBldProfile());
  const {
    cursor,
    setCursor,
    playing,
    setPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    cubeMotion,
    selectCursor,
    resetToStart,
  } = useSolverPlayback(result);
  const [loading, setLoading] = useState(false);
  const [solverStatus, setSolverStatus] = useState("");
  const [cubeView, setCubeView] = useState<"2d" | "3d">("3d");
  const [error, setError] = useState("");
  const stateValidation = useStateValidation({
    enabled: mode === "state",
    value,
    language,
    incompleteMessage: t("home.incompleteState"),
  });
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
  const [, setStateHistoryVersion] = useState(0);

  const previewState = useMemo(() => {
    if (mode === "state") return stateValidation?.valid ? value : SOLVED_STATE;
    try {
      if (!value.trim()) return SOLVED_STATE;
      // CFOP: khối thật khi tráo theo chuẩn WCA (trắng U, xanh lá F).
      // BLD: giữ trắng U, xanh lá F (người giải mù không lật khối).
      return solverKind === "bld"
        ? wcaLettersToStudio(stateFromScramble(value))
        : scrambledState(value);
    } catch {
      return SOLVED_STATE;
    }
  }, [mode, solverKind, value]);
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
  // Lời giải viết theo hướng đang cầm (màu cross ở D) và phép xoay ghi ở đầu;
  // khối 3D vẫn chạy bằng các lượt gốc của bộ giải (`result`).
  const solvedFrom = useRef<"scramble" | "state">("scramble");
  const displayResult = useMemo(
    () => (result ? heldNotationResult(result, crossColor) : null),
    [crossColor, result]
  );
  const setupRotation = useMemo(
    () => solutionSetupRotation(crossColor, solvedFrom.current),
    // `result` đổi sau mỗi lần giải, khi `solvedFrom` đã được cập nhật.
    [crossColor, result]
  );
  const currentStepLabel = displayResult?.trace[cursor - 1]?.move;
  const activePhase = phaseAt(result, cursor);
  const totalMoves = result?.trace.length ?? 0;
  const openingTelemetry = result?.opening;
  const lastLayerTelemetry = result?.last_layer;
  const openingOutcome = useMemo(() => openingOutcomeOf(result), [result]);
  const activeXCrossSlots = xcrossSlotsOf(activePhase?.name);
  const activeLastLayerCase = lastLayerCaseOf(activePhase);

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
      // Nhường một khung hình để hiện trạng thái "đang chuẩn bị". Tab nằm nền
      // không chạy requestAnimationFrame, nên có hẹn giờ dự phòng: nếu không,
      // bấm giải rồi chuyển tab thì bộ giải chỉ chạy khi quay lại.
      await new Promise<void>(resolve => {
        window.requestAnimationFrame(() => resolve());
        window.setTimeout(resolve, 50);
      });
      if (solverKind === "bld") {
        setSolverStatus(t("home.buildingMemo"));
        const next = await analyzeBldInBrowser(mode, value.trim());
        setBldResult(next);
        setResult(null);
        resetToStart();
        if (mode === "state") saveRecentState(value.trim(), crossColor);
        return;
      }
      setSolverStatus(
        t("home.searching", { opening: openingModeLabel(opening, language) })
      );
      // Scramble được đổi thành trạng thái thật (tráo cầm trắng U, xanh lá F)
      // ngay trong trang, để bộ giải và hình hiển thị cùng một khối.
      solvedFrom.current = mode === "state" ? "state" : "scramble";
      const next = await solveInBrowser(
        "state",
        mode === "state" ? value.trim() : scrambledState(value.trim()),
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
      resetToStart();
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
  // BLD: memo tính theo khung WCA (U = mặt trên = trắng); chỉ đổi màu để vẽ
  // khối đúng như cầm trắng U, xanh lá F khi tráo.
  const bldDisplayState = bldResult
    ? mode === "state"
      ? bldResult.initial_state
      : wcaLettersToStudio(bldResult.initial_state)
    : undefined;
  const stage =
    solverKind === "bld" ? (bldDisplayState ?? currentState) : currentState;
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
        ? `${t("guide.move")}: ${currentStepLabel ?? currentStep.move}`
        : hasResult
          ? t("home.solutionReady")
          : t("guide.help");
  const solutionMove =
    solverKind === "bld"
      ? bldResult
        ? `${bldResult.analysis.edges.memo.length} / ${bldResult.analysis.corners.memo.length}`
        : "—"
      : (currentStepLabel ?? currentStep?.move ?? "—");

  const firstStepsBanner =
    solverKind !== "bld" && openingOutcome ? (
      <OpeningOutcomeBanner outcome={openingOutcome} telemetry={openingTelemetry} />
    ) : null;

  return (
    <div className="mx-auto w-full max-w-[88rem] px-4 sm:px-6 lg:px-8 lg:px-6 pb-6 lg:pb-12">
      <section className="my-8">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl mb-2">
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
                      ? (bldDisplayState ?? currentState)
                      : mode === "state"
                        ? value.length === 54
                          ? value
                          : SOLVED_STATE
                        : orientForCross(currentState, crossColor)
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
                  alignCross={solverKind !== "bld"}
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
              <LastLayerOutcomeBanner telemetry={lastLayerTelemetry} />
            ) : null}
          </div>
        </div>

        <SolverSolutionSidebar>
          {solverKind === "bld" && bldResult ? (
            <BldReport
              result={bldResult}
              language={language}
              profile={bldProfile}
              onProfile={setBldProfile}
            />
          ) : result ? (
            <CfopReport
              result={displayResult ?? result}
              setupRotation={setupRotation}
              crossColor={crossColor}
              language={language}
              activePhase={activePhase?.name ?? null}
              cursor={cursor}
              onSelectPhase={phase => selectCursor(phase.end, "phase")}
              onSelectMove={moveIndex => selectCursor(moveIndex, "seek")}
            />
          ) : null}
        </SolverSolutionSidebar>
      </div>
    </div>
  );
}
