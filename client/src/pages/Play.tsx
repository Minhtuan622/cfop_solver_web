import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Grid, RotateCcw, Timer } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/StudioUI";
import { PlayClearDialog } from "@/features/play/components/PlayClearDialog";
import { PlayCubeOverlay } from "@/features/play/components/PlayCubeOverlay";
import { PlayHistoryPanel } from "@/features/play/components/PlayHistoryPanel";
import { PlayKeysPanel } from "@/features/play/components/PlayKeysPanel";
import { PlayModeTabs } from "@/features/play/components/PlayModeTabs";
import { PlayRacePanel } from "@/features/play/components/PlayRacePanel";
import { useMediaQuery } from "@/features/play/lib/useMediaQuery";
import type { PlayMode, RaceStatus } from "@/features/play/lib/playTypes";
import { PlayMovePad } from "@/features/play/components/PlayMovePad";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Cube3DGuide } from "@/components/common/Cube3DGuide";
import { applyFastMoves, SOLVED_FAST_STATE, stateFromScramble } from "@/lib/fastCube";
import { randomThreeByThreeScramble } from "@/lib/cubeScramble";
import {
  DEFAULT_LAYER_SELECTION,
  facesUniform,
  inspectionPenalty,
  normalizePlayKey,
  playActionForKey,
  type LayerSelection,
} from "@/features/play/lib/playCube";
import {
  addPlayHistory,
  clearPlayHistory,
  deletePlayHistory,
  formatPlayTime,
  readPlayHistory,
  type PlayHistoryEntry,
} from "@/features/play/lib/playHistory";

export default function PlayPage() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<PlayMode>("free");
  const [state, setState] = useState(SOLVED_FAST_STATE);
  const stateRef = useRef(SOLVED_FAST_STATE);
  const prevStateRef = useRef(SOLVED_FAST_STATE);
  const [move, setMove] = useState<string | undefined>(undefined);
  const [transition, setTransition] = useState<"idle" | "move">("idle");
  const [transitionId, setTransitionId] = useState(0);
  const [selection, setSelection] = useState<LayerSelection>(DEFAULT_LAYER_SELECTION);
  const selectionRef = useRef(DEFAULT_LAYER_SELECTION);
  const [moveCount, setMoveCount] = useState(0);
  const moveCountRef = useRef(0);
  const movesRef = useRef<string[]>([]);
  const [scramble, setScramble] = useState(() => randomThreeByThreeScramble());
  const [status, setStatus] = useState<RaceStatus>("idle");
  const statusRef = useRef<RaceStatus>(status);
  const [inspectionLeft, setInspectionLeft] = useState(15);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef(0);
  const inspectionStartRef = useRef(0);
  const inspectionMsRef = useRef(0);
  const penaltyRef = useRef<"none" | "+2" | "DNF">("none");
  const [inspectionEnabled, setInspectionEnabled] = useState(true);
  const [entries, setEntries] = useState<PlayHistoryEntry[]>(() => readPlayHistory());
  const [clearOpen, setClearOpen] = useState(false);
  const [keysOpen, setKeysOpen] = useState(
    () => typeof window === "undefined" || !window.matchMedia?.("(max-width: 1023px)").matches
  );
  const [padOpen, setPadOpen] = useState(false);
  const narrowScreen = useMediaQuery("(max-width: 639px)");

  const commitCube = (prev: string, next: string, token?: string) => {
    prevStateRef.current = prev;
    stateRef.current = next;
    setState(next);
    if (token) {
      setMove(token);
      setTransition("move");
      setTransitionId(id => id + 1);
    } else {
      setMove(undefined);
      setTransition("idle");
    }
  };

  const resetSelection = () => {
    selectionRef.current = DEFAULT_LAYER_SELECTION;
    setSelection(DEFAULT_LAYER_SELECTION);
  };

  const resetCube = (freshScramble: boolean) => {
    stateRef.current = SOLVED_FAST_STATE;
    prevStateRef.current = SOLVED_FAST_STATE;
    setState(SOLVED_FAST_STATE);
    setMove(undefined);
    setTransition("idle");
    movesRef.current = [];
    moveCountRef.current = 0;
    setMoveCount(0);
    resetSelection();
    if (freshScramble) setScramble(randomThreeByThreeScramble());
    setStatus("idle");
    setElapsedMs(0);
    setInspectionLeft(15);
  };

  const recordSolve = (penalty: "none" | "+2" | "DNF", elapsed: number) => {
    setEntries(
      addPlayHistory({
        elapsedMs: Math.round(elapsed),
        inspectionMs: Math.round(inspectionMsRef.current),
        penalty,
        scramble,
        solution: movesRef.current.join(" "),
        moves: moveCountRef.current,
      }),
    );
  };

  const finishIfSolved = () => {
    if (!facesUniform(stateRef.current)) return;
    const elapsed = performance.now() - startRef.current;
    recordSolve(penaltyRef.current, elapsed);
    toast.success(t("play.solveRecorded", { time: formatPlayTime(elapsed) }));
    resetCube(true);
  };

  const applyMoveToken = (token: string, rotation: boolean) => {
    const prev = stateRef.current;
    const next = applyFastMoves(prev, token);
    commitCube(prev, next, token);
    movesRef.current = [...movesRef.current, token];
    if (!rotation) {
      moveCountRef.current += 1;
      setMoveCount(moveCountRef.current);
    }
  };

  const dispatchMove = (token: string, rotation: boolean) => {
    if (mode === "race") {
      const cur = statusRef.current;
      if (cur === "armed") {
        const now = performance.now();
        inspectionMsRef.current = 0;
        penaltyRef.current = "none";
        startRef.current = now;
        setElapsedMs(0);
        setStatus("solving");
        statusRef.current = "solving";
        applyMoveToken(token, rotation);
        finishIfSolved();
        return;
      }
      if (cur === "inspection") {
        if (!rotation) {
          const now = performance.now();
          const ins = now - inspectionStartRef.current;
          inspectionMsRef.current = ins;
          penaltyRef.current = inspectionPenalty(ins);
          startRef.current = now;
          setElapsedMs(0);
          setStatus("solving");
          statusRef.current = "solving";
        }
        applyMoveToken(token, rotation);
        finishIfSolved();
        return;
      }
      if (cur === "solving") {
        applyMoveToken(token, rotation);
        finishIfSolved();
      }
      return;
    }
    applyMoveToken(token, rotation);
  };

  const onSpace = () => {
    if (mode !== "race" || status !== "idle") return;
    const scrambled = stateFromScramble(scramble);
    stateRef.current = scrambled;
    prevStateRef.current = SOLVED_FAST_STATE;
    setState(scrambled);
    setMove(undefined);
    setTransition("idle");
    movesRef.current = [];
    moveCountRef.current = 0;
    setMoveCount(0);
    resetSelection();
    penaltyRef.current = "none";
    inspectionMsRef.current = 0;
    if (inspectionEnabled) {
      inspectionStartRef.current = performance.now();
      setInspectionLeft(15);
      setStatus("inspection");
      statusRef.current = "inspection";
    } else {
      setStatus("armed");
      statusRef.current = "armed";
    }
  };

  const onEscape = () => {
    if (mode === "race" && status === "solving") {
      recordSolve("DNF", performance.now() - startRef.current);
      toast.error(t("play.solveDnf"));
      resetCube(true);
      return;
    }
    resetCube(false);
  };

  useEffect(() => {
    statusRef.current = status;
    if (status !== "inspection" && status !== "solving") return undefined;
    let raf = 0;
    const tick = () => {
      if (statusRef.current === "inspection") {
        setInspectionLeft(
          Math.max(0, 15 - (performance.now() - inspectionStartRef.current) / 1000),
        );
      } else if (statusRef.current === "solving") {
        setElapsedMs(performance.now() - startRef.current);
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [status]);

  const handlerRef = useRef<(event: KeyboardEvent) => void>(() => undefined);
  handlerRef.current = event => {
    if (clearOpen) return;
    const target = event.target as HTMLElement | null;
    if (
      target &&
      target.closest(
        "input, textarea, select, [contenteditable='true'], [role='dialog']",
      )
    ) {
      return;
    }
    const key = normalizePlayKey(event);
    if (!key) return;
    const action = playActionForKey(key, selectionRef.current);
    if (!action) return;
    if (
      key === " " &&
      target?.closest(
        "button, a[href], [role='tab'], [role='switch'], input, summary",
      )
    ) {
      return;
    }
    switch (action.kind) {
      case "camera":
        return;
      case "space":
        event.preventDefault();
        if (!event.repeat) onSpace();
        return;
      case "escape":
        onEscape();
        return;
      case "layer":
        event.preventDefault();
        selectionRef.current = action.selection;
        setSelection(action.selection);
        return;
      case "move":
        event.preventDefault();
        dispatchMove(action.move, action.rotation);
    }
  };
  useEffect(() => {
    const listener = (event: KeyboardEvent) => handlerRef.current(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const switchMode = (next: PlayMode) => {
    if (next === mode) return;
    setMode(next);
    resetCube(false);
  };

  const newScramble = () => {
    if (status !== "idle") return;
    setScramble(randomThreeByThreeScramble());
    resetCube(false);
  };

  const raceBusy = mode === "race" && status !== "idle";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <PageHeader
        title={t("play.title")}
        description={t("play.subtitle")}
        actions={
          <Link
            href="/timer"
            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-surface px-3.5 py-2 text-sm font-semibold text-ink transition hover:bg-surface-2 focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            <Timer className="text-base" aria-hidden="true" />
            {t("nav.timer")}
          </Link>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 xl:col-span-8">
          <div className="rounded-card bg-surface p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PlayModeTabs mode={mode} onChange={switchMode} />
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
                <span className="rounded-full bg-surface-2 px-3 py-1.5">
                  {t("play.movesLabel", { count: moveCount })}
                </span>
                <span className="rounded-full bg-surface-2 px-3 py-1.5">
                  {t("play.layersLabel", { oSl: selection.oSl, oSr: selection.oSr })}
                </span>
              </div>
            </div>

            <div className="relative mt-2">
              <Cube3DGuide
                state={state}
                previousState={prevStateRef.current}
                move={move}
                step={transitionId}
                transition={transition}
                transitionId={transitionId}
                turnDurationMs={170}
                surface="light"
                initialOrbit={0.55}
                initialPitch={0.3}
                orbitKeys
                stageHeight={narrowScreen ? 300 : 420}
              />
              <PlayCubeOverlay
                mode={mode}
                status={status}
                elapsedMs={elapsedMs}
                inspectionLeft={inspectionLeft}
              />
            </div>

            {mode === "race" ? (
              <PlayRacePanel
                status={status}
                scramble={scramble}
                inspectionEnabled={inspectionEnabled}
                onInspectionChange={setInspectionEnabled}
                busy={raceBusy}
                onNewScramble={newScramble}
                onStart={onSpace}
                onCancel={onEscape}
              />
            ) : (
              <p className="mb-0 mt-2 text-center text-xs text-muted">{t("play.freeHint")}</p>
            )}

            <div className={cn("mt-4", padOpen ? "" : "lg:hidden")}>
              <PlayMovePad
                onMove={dispatchMove}
                disabled={mode === "race" && status === "idle"}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="hidden lg:block">
                <button
                  type="button"
                  className={buttonClass("soft", "sm")}
                  aria-pressed={padOpen}
                  onClick={event => {
                    event.currentTarget.blur();
                    setPadOpen(open => !open);
                  }}
                >
                  <Grid className="text-base" aria-hidden="true" />
                  {padOpen ? t("play.hidePad") : t("play.showPad")}
                </button>
              </div>
              <button
                type="button"
                className={cn(buttonClass("soft", "sm"), "ml-auto")}
                onClick={event => {
                  event.currentTarget.blur();
                  resetCube(false);
                }}
              >
                <RotateCcw className="text-base" aria-hidden="true" />
                {t("play.resetCube")}
              </button>
            </div>
          </div>
        </section>

        <aside className="col-span-12 flex flex-col gap-6 xl:col-span-4">
          <PlayHistoryPanel
            entries={entries}
            onDelete={id => setEntries(deletePlayHistory(id))}
            onClear={() => setClearOpen(true)}
          />

          <PlayKeysPanel open={keysOpen} onToggle={() => setKeysOpen(open => !open)} />
        </aside>
      </div>

      <PlayClearDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        count={entries.length}
        onConfirm={() => setEntries(clearPlayHistory())}
      />
    </div>
  );
}
