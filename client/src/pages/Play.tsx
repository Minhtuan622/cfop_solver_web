/**
 * Rubik ảo bằng bàn phím — virtual keyboard-driven 3×3 cube.
 *
 * Free-play mode: manipulate the cube freely. Race mode: csTimer's virtual
 * cube flow — Space applies the scramble and starts inspection, the first
 * turn starts the clock, solving the cube stops it and records the solve
 * into a standalone history (never mixed with real solve statistics).
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  BarChart3,
  ChevronDown,
  Dices,
  ListUl,
  RotateCcw,
  Timer,
  Trash2,
} from "@/components/ui/Icon";
import { PageHeader, Switch, StatTile, IconButton, EmptyState } from "@/components/ui/StudioUI";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/StudioDialog";
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
} from "@/lib/playCube";
import {
  addPlayHistory,
  clearPlayHistory,
  deletePlayHistory,
  formatPlayTime,
  playEffectiveTime,
  playStats,
  readPlayHistory,
  type PlayHistoryEntry,
} from "@/lib/playHistory";

type PlayMode = "free" | "race";
type RaceStatus = "idle" | "inspection" | "armed" | "solving";

export default function Play() {
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
  const [keysOpen, setKeysOpen] = useState(true);

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
      if (cur === "inspection" || cur === "armed") {
        if (!rotation) {
          const now = performance.now();
          if (cur === "inspection") {
            const ins = now - inspectionStartRef.current;
            inspectionMsRef.current = ins;
            penaltyRef.current = inspectionPenalty(ins);
          } else {
            inspectionMsRef.current = 0;
            penaltyRef.current = "none";
          }
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

  // Clock for inspection countdown and the running solve timer.
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

  // Keyboard control — the whole point of the page.
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
    switch (action.kind) {
      case "camera":
        return; // handled by CubeGuide3D's own arrow-key orbit
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

  const stats = playStats(entries);
  const bestText = stats.bestMs !== null ? formatPlayTime(stats.bestMs) : "—";
  const ao5Text = stats.ao5Ms !== null ? formatPlayTime(stats.ao5Ms) : "—";

  const keyRows = [
    t("play.keyFaces"),
    t("play.keyWide"),
    t("play.keySlice"),
    t("play.keyRotate"),
    t("play.keyLayers"),
    t("play.keyCamera"),
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <PageHeader
        title={t("play.title")}
        description={t("play.subtitle")}
        eyebrow={t("play.eyebrow")}
        actions={
          <Link
            href="/timer"
            aria-label={t("nav.timer")}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-surface px-3 py-1.5 text-xs font-semibold leading-none text-ink transition hover:bg-surface-2 focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            <Timer className="text-base" />
            {t("nav.timer")}
          </Link>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        {/* ===== Cube ===== */}
        <section className="col-span-12 xl:col-span-7">
          <div className="rounded-card bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6 sm:pt-5">
              <div
                role="tablist"
                aria-label={t("play.eyebrow")}
                className="inline-flex rounded-full bg-surface-2 p-1"
              >
                {(
                  [
                    { id: "free", label: t("play.modeFree") },
                    { id: "race", label: t("play.modeRace") },
                  ] as const
                ).map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={mode === tab.id}
                    onClick={() => switchMode(tab.id)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-semibold transition focus-visible:ring-4 focus-visible:ring-primary/20",
                      mode === tab.id
                        ? "bg-primary text-on-primary"
                        : "text-muted hover:text-ink",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {mode === "race" ? (
                <Switch
                  id="play-inspection"
                  checked={inspectionEnabled}
                  onChange={setInspectionEnabled}
                  disabled={status !== "idle"}
                  label={t("play.inspectionLabel")}
                />
              ) : (
                <p className="max-w-64 text-xs text-muted">{t("play.freeHint")}</p>
              )}
            </div>

            <div className="relative px-2">
              <Cube3DGuide
                state={state}
                previousState={prevStateRef.current}
                move={move}
                step={transitionId}
                transition={transition}
                transitionId={transitionId}
                turnDurationMs={170}
                surface="light"
                alignCross={false}
                initialOrbit={0.55}
                initialPitch={0.3}
                orbitKeys
              />
              <div
                className="pointer-events-none absolute inset-0 grid place-items-center"
                aria-live="polite"
              >
                {mode === "race" && status === "solving" ? (
                  <p className="rounded-full bg-ink/70 px-6 py-3 font-mono text-5xl font-bold tabular-nums text-white sm:text-6xl">
                    {formatPlayTime(elapsedMs)}
                  </p>
                ) : null}
                {mode === "race" && status === "inspection" ? (
                  <p
                    className={cn(
                      "rounded-full bg-ink/70 px-6 py-3 font-mono text-6xl font-bold tabular-nums",
                      inspectionLeft <= 3 ? "text-red-400" : "text-white",
                    )}
                  >
                    {Math.ceil(inspectionLeft)}
                  </p>
                ) : null}
                {mode === "race" && (status === "armed" || status === "idle") ? (
                  <p className="max-w-xs rounded-full bg-ink/70 px-6 py-3 text-center text-sm font-semibold text-white">
                    {status === "armed" ? t("play.readyHint") : t("play.startHint")}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 p-4 sm:px-6 sm:pb-5">
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted">
                <span className="rounded-full bg-surface-2 px-3 py-1">
                  {t("play.movesLabel", { count: moveCount })}
                </span>
                <span className="rounded-full bg-surface-2 px-3 py-1">
                  {t("play.layersLabel", { oSl: selection.oSl, oSr: selection.oSr })}
                </span>
              </div>
              <button
                type="button"
                className={buttonClass("secondary", "sm")}
                onClick={() => resetCube(false)}
              >
                <RotateCcw className="text-base" />
                {t("play.resetCube")}
              </button>
            </div>
          </div>

          {mode === "race" ? (
            <div className="mt-4 rounded-card bg-surface p-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {t("play.scramble")}
                </span>
                <button
                  type="button"
                  className={buttonClass("secondary", "sm")}
                  onClick={newScramble}
                  disabled={status !== "idle"}
                >
                  <Dices className="text-base" />
                  {t("play.newScramble")}
                </button>
              </div>
              <p className="mt-2 font-mono text-sm leading-relaxed text-ink">{scramble}</p>
              <p className="mt-2 text-xs text-muted">{t("play.idleDnfHint")}</p>
            </div>
          ) : null}

          <div className="mt-4 rounded-card bg-surface p-4 sm:px-6">
            <button
              type="button"
              onClick={() => setKeysOpen(open => !open)}
              aria-expanded={keysOpen}
              className="flex w-full items-center justify-between gap-2 py-1 text-left text-sm font-semibold text-ink focus-visible:ring-4 focus-visible:ring-primary/20 rounded-panel"
            >
              {t("play.keysTitle")}
              <ChevronDown
                className={cn("text-lg transition-transform", keysOpen && "rotate-180")}
              />
            </button>
            {keysOpen ? (
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted">
                {keyRows.map(row => (
                  <li key={row}>{row}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>

        {/* ===== Standalone history ===== */}
        <aside className="col-span-12 xl:col-span-5">
          <div className="rounded-card bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold tracking-tight text-ink">
                {t("play.historyTitle")}
              </h2>
              {entries.length > 0 ? (
                <button
                  type="button"
                  className={buttonClass("danger", "sm")}
                  onClick={() => setClearOpen(true)}
                >
                  <Trash2 className="text-base" />
                  {t("play.clearAll")}
                </button>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted">{t("play.historyNote")}</p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <StatTile
                label={t("play.best")}
                value={bestText}
                icon={<Timer className="text-lg" />}
              />
              <StatTile
                label={t("play.ao5")}
                value={ao5Text}
                icon={<BarChart3 className="text-lg" />}
              />
              <StatTile
                label={t("play.solves")}
                value={String(stats.count)}
                icon={<ListUl className="text-lg" />}
              />
            </div>

            {entries.length === 0 ? (
              <div className="mt-4">
                <EmptyState title={t("play.historyEmpty")} />
              </div>
            ) : (
              <ul className="mt-4 flex flex-col gap-1">
                {entries.slice(0, 12).map(entry => {
                  const effective = playEffectiveTime(entry);
                  return (
                    <li
                      key={entry.id}
                      className="flex items-center gap-3 rounded-panel px-2 py-2 transition hover:bg-surface-2"
                    >
                      <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                        {effective !== null ? formatPlayTime(effective) : "DNF"}
                      </span>
                      {entry.penalty !== "none" ? (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold",
                            entry.penalty === "+2"
                              ? "bg-warning-soft text-ink"
                              : "bg-danger-soft text-danger",
                          )}
                        >
                          {entry.penalty}
                        </span>
                      ) : null}
                      <span className="text-[11px] text-muted">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                      <span className="hidden text-[11px] text-muted sm:inline">
                        {t("play.movesLabel", { count: entry.moves })}
                      </span>
                      <IconButton
                        label={t("play.deleteSolve")}
                        icon={<Trash2 className="text-base" />}
                        onClick={() => setEntries(deletePlayHistory(entry.id))}
                        className="ml-auto hover:text-danger"
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {/* ===== Clear confirmation ===== */}
      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("play.clearTitle")}</DialogTitle>
            <DialogDescription>
              {t("play.clearDetail", { count: entries.length })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              className={buttonClass("secondary", "md")}
              onClick={() => setClearOpen(false)}
            >
              {t("play.cancel")}
            </button>
            <button
              type="button"
              className={buttonClass("dangerSolid", "md")}
              onClick={() => {
                setEntries(clearPlayHistory());
                setClearOpen(false);
              }}
            >
              {t("play.clearConfirm")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
