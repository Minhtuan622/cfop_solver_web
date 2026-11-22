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
  ChevronDown,
  Dices,
  Grid,
  Play,
  RotateCcw,
  Timer,
  Trash2,
} from "@/components/ui/Icon";
import { PageHeader, Switch, StatTile, IconButton } from "@/components/ui/StudioUI";
import { PlayKeyMap } from "@/features/play/components/PlayKeyMap";
import { PlayMovePad } from "@/features/play/components/PlayMovePad";
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
  // Màn hình nhỏ thường không có bàn phím: thu gọn bảng phím mặc định.
  const [keysOpen, setKeysOpen] = useState(
    () => typeof window === "undefined" || !window.matchMedia?.("(max-width: 1023px)").matches
  );
  const [padOpen, setPadOpen] = useState(false);
  // Màn hình hẹp: khung khối thấp hơn để khối không bị phóng quá to và cắt.
  const [narrowScreen, setNarrowScreen] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(max-width: 639px)").matches
  );
  useEffect(() => {
    const query = window.matchMedia?.("(max-width: 639px)");
    if (!query) return undefined;
    const update = () => setNarrowScreen(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

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
        // No inspection phase at all: the clock starts on the first move of
        // any kind, including whole-cube rotations. (Inspection mode keeps
        // rotations free for looking around, like csTimer.)
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
          // csTimer: rotations stay free during inspection (looking around);
          // the clock starts at the first face move.
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
    // A focused control handles Space itself (button, tab, switch…) — let
    // it activate instead of starting a scramble behind the user's back.
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
        {/* ===== Khối: lớn, ở giữa; điều khiển gọn quanh khối ===== */}
        <section className="col-span-12 xl:col-span-8">
          <div className="rounded-card bg-surface p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="tablist"
                aria-label={t("play.modeLabel")}
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
                    onClick={event => {
                      switchMode(tab.id);
                      // Trả Space về cho khối: sau khi chọn chế độ, Space phải
                      // xáo trộn chứ không bấm lại tab.
                      event.currentTarget.blur();
                    }}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-semibold transition focus-visible:ring-4 focus-visible:ring-primary/20",
                      mode === tab.id
                        ? "bg-primary text-on-primary"
                        : "text-muted hover:text-ink"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
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
                alignCross={false}
                initialOrbit={0.55}
                initialPitch={0.3}
                orbitKeys
                stageHeight={narrowScreen ? 300 : 420}
              />
              <div
                className="pointer-events-none absolute inset-0 grid place-items-center"
                aria-live="polite"
              >
                {mode === "race" && status === "solving" ? (
                  <p className="rounded-full bg-canvas/90 px-6 py-3 font-mono text-5xl font-bold tabular-nums text-ink sm:text-6xl">
                    {formatPlayTime(elapsedMs)}
                  </p>
                ) : null}
                {mode === "race" && status === "inspection" ? (
                  <p
                    className={cn(
                      "rounded-full bg-canvas/90 px-6 py-3 font-mono text-6xl font-bold tabular-nums",
                      inspectionLeft <= 3 ? "text-danger" : "text-ink"
                    )}
                  >
                    {Math.ceil(inspectionLeft)}
                  </p>
                ) : null}
                {mode === "race" && (status === "armed" || status === "idle") ? (
                  <p className="max-w-xs rounded-full bg-canvas/90 px-6 py-3 text-center text-sm font-semibold text-ink">
                    {status === "armed" ? t("play.readyHint") : t("play.startHint")}
                  </p>
                ) : null}
              </div>
            </div>

            {mode === "race" ? (
              <div className="mt-2 rounded-panel bg-surface-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {t("play.scramble")}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {status === "idle" ? (
                      <>
                        <button
                          type="button"
                          className={buttonClass("secondary", "sm")}
                          onClick={newScramble}
                        >
                          <Dices className="text-base" aria-hidden="true" />
                          {t("play.newScramble")}
                        </button>
                        {/* Điện thoại không có phím Space: nút thay thế. */}
                        <button
                          type="button"
                          className={buttonClass("primary", "sm")}
                          onClick={event => {
                            event.currentTarget.blur();
                            onSpace();
                          }}
                        >
                          <Play className="text-base" aria-hidden="true" />
                          {t("play.startButton")}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className={buttonClass("danger", "sm")}
                        onClick={event => {
                          event.currentTarget.blur();
                          onEscape();
                        }}
                      >
                        {status === "solving" ? t("play.stopDnf") : t("play.cancelAttempt")}
                      </button>
                    )}
                  </div>
                </div>
                <p className="mb-0 mt-2 font-mono text-sm leading-relaxed text-ink">{scramble}</p>
                {mode === "race" ? (
                  <div className="mt-3">
                    <Switch
                      id="play-inspection"
                      checked={inspectionEnabled}
                      onChange={setInspectionEnabled}
                      disabled={raceBusy}
                      label={t("play.inspectionLabel")}
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mb-0 mt-2 text-center text-xs text-muted">{t("play.freeHint")}</p>
            )}

            {/* Bàn nút xoay: luôn hiện trên màn hình nhỏ/cảm ứng; trên máy tính
                bật bằng nút bên dưới. */}
            <div className={cn("mt-4", padOpen ? "" : "lg:hidden")}>
              <PlayMovePad
                onMove={dispatchMove}
                disabled={mode === "race" && status === "idle"}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              {/* Chỉ trên màn hình lớn; màn hình nhỏ luôn hiện bàn nút. */}
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

        {/* ===== Lịch sử riêng + bộ phím ===== */}
        <aside className="col-span-12 flex flex-col gap-6 xl:col-span-4">
          <div className="rounded-card bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="mb-0 text-base font-semibold tracking-tight text-ink">
                {t("play.historyTitle")}
              </h2>
              {entries.length > 0 ? (
                <button
                  type="button"
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger-soft focus-visible:ring-4 focus-visible:ring-primary/20"
                  onClick={() => setClearOpen(true)}
                >
                  {t("play.clearAll")}
                </button>
              ) : null}
            </div>
            <p className="mb-0 mt-1 text-xs text-muted">{t("play.historyNote")}</p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <StatTile compact label={t("play.best")} value={bestText} />
              <StatTile compact label={t("play.ao5")} value={ao5Text} />
              <StatTile compact label={t("play.solves")} value={String(stats.count)} />
            </div>

            {entries.length === 0 ? (
              <p className="mb-0 mt-4 rounded-panel bg-surface-2 px-4 py-6 text-center text-sm text-muted">
                {t("play.historyEmpty")}
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-1">
                {entries.slice(0, 12).map(entry => {
                  const effective = playEffectiveTime(entry);
                  return (
                    <li
                      key={entry.id}
                      className="group flex items-center gap-3 rounded-panel px-2 py-2 transition-colors hover:bg-surface-2"
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
                              : "bg-danger-soft text-danger"
                          )}
                        >
                          {entry.penalty}
                        </span>
                      ) : null}
                      <span className="text-[11px] text-muted">
                        {t("play.movesLabel", { count: entry.moves })}
                      </span>
                      <span className="ml-auto text-[11px] text-muted">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                      <IconButton
                        label={t("play.deleteSolve")}
                        icon={<Trash2 className="text-base" />}
                        onClick={() => setEntries(deletePlayHistory(entry.id))}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-danger-soft hover:text-danger"
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-card bg-surface p-5 sm:p-6">
            <button
              type="button"
              onClick={() => setKeysOpen(open => !open)}
              aria-expanded={keysOpen}
              className="flex w-full items-center justify-between gap-2 rounded-panel text-left text-base font-semibold tracking-tight text-ink focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              {t("play.keysTitle")}
              <ChevronDown
                className={cn("text-lg text-muted transition-transform", keysOpen && "rotate-180")}
                aria-hidden="true"
              />
            </button>
            {keysOpen ? (
              <div className="mt-4">
                <PlayKeyMap />
              </div>
            ) : null}
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
