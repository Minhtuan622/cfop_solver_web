/**
 * Phân tích một lượt giải bằng smart cube: bảng nhận diện / thực hiện theo giai
 * đoạn, quãng dừng dài nhất, case OLL / PLL đã gặp (nối sang Học thêm), so với
 * bộ giải và phát lại đúng nhịp thật của từng nước.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/StudioDialog";
import { SolutionStage } from "@/features/puzzle-solver";
import { SolverSolutionPanel } from "@/features/solver/components/SolverSolutionPanel";
import { useSolverPlayback } from "@/features/solver/lib/useSolverPlayback";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SolveHistoryEntry, SplitPhase } from "@/lib/solveHistory";
import {
  analyzeSolve,
  identifySolveCases,
  type IdentifiedCase,
  type LastLayerCase,
  type SolveCases,
} from "../lib/solveAnalysis";
import {
  compareWithSolver,
  type SolverComparison,
} from "../lib/solverComparison";

const seconds = (ms: number) => `${(ms / 1000).toFixed(2)}s`;
const PHASES: SplitPhase[] = ["Cross", "F2L", "OLL", "PLL"];
/** Một nước 3D cần ~100 ms để thấy rõ; nghỉ quá dài thì rút lại cho đỡ chờ. */
const MIN_STEP_MS = 110;
const MAX_STEP_MS = 2_500;
const FIRST_STEP_MS = 500;

type Catalog = { oll: LastLayerCase[]; pll: LastLayerCase[] };
type ComparisonState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; comparison: SolverComparison }
  | { status: "error" };

function CaseLine({
  label,
  value,
}: {
  label: string;
  value: IdentifiedCase | "skip" | null;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      {value === "skip" ? (
        <strong>{t("analysis.skip")}</strong>
      ) : value ? (
        <span className="flex items-center gap-2">
          <strong>{value.name}</strong>
          <Link
            href={`/study?lane=cfop&case=${encodeURIComponent(value.id)}`}
            className="text-primary underline underline-offset-2"
          >
            {t("analysis.practice")}
          </Link>
        </span>
      ) : (
        <span className="text-muted">{t("analysis.unknown")}</span>
      )}
    </div>
  );
}

export function SolveAnalysisDialog({
  entry,
  onClose,
}: {
  entry: SolveHistoryEntry | null;
  onClose: () => void;
}) {
  const { language, t } = useLanguage();
  const moves = useMemo(
    () => (entry?.solution.trim() ? entry.solution.trim().split(/\s+/) : []),
    [entry]
  );
  const times = entry?.moveTimes;
  const analysis = useMemo(
    () =>
      entry && times
        ? analyzeSolve({ moves, moveTimes: times, phaseSplits: entry.phaseSplits })
        : null,
    [entry, moves, times]
  );

  // Danh mục case chỉ nạp khi mở hộp thoại (không nằm trong chunk đầu của Timer).
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  useEffect(() => {
    if (!entry) return;
    let cancelled = false;
    void import("@/features/cfop/lib/cfopCatalog").then(({ CFOP_CATALOG }) => {
      if (cancelled) return;
      setCatalog({
        oll: CFOP_CATALOG.filter(item => item.family === "oll"),
        pll: CFOP_CATALOG.filter(item => item.family === "pll"),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [entry]);
  const cases: SolveCases | null = useMemo(
    () =>
      entry && analysis && catalog
        ? identifySolveCases(entry.input, moves, analysis, catalog)
        : null,
    [entry, analysis, catalog, moves]
  );

  const [comparison, setComparison] = useState<ComparisonState>({ status: "idle" });
  useEffect(() => setComparison({ status: "idle" }), [entry]);
  const runComparison = async () => {
    if (!entry) return;
    setComparison({ status: "loading" });
    try {
      setComparison({
        status: "ready",
        comparison: await compareWithSolver(entry.input),
      });
    } catch {
      setComparison({ status: "error" });
    }
  };

  // Phát lại đúng nhịp: chờ giữa hai nước bằng đúng khoảng cách lúc giải.
  const source = useMemo(
    () => (entry && times ? { trace: moves } : null),
    [entry, times, moves]
  );
  const playback = useSolverPlayback(
    source,
    {
      delayFor: (cursor, speed) => {
        if (!times || cursor <= 0 || cursor >= times.length) return FIRST_STEP_MS / speed;
        const gap = times[cursor] - times[cursor - 1];
        return Math.min(MAX_STEP_MS, Math.max(MIN_STEP_MS, gap)) / speed;
      },
    }
  );
  useEffect(() => {
    playback.setPlaying(false);
    playback.setCursor(0);
    // Chỉ khi đổi lượt giải.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);
  const cursor = playback.cursor;
  const currentPhase = analysis?.phases.find(
    item => cursor > item.start && cursor <= item.end
  );
  const stepMove = cursor > 0 ? (moves[cursor - 1] ?? null) : null;

  return (
    <Dialog open={Boolean(entry)} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div>
            <DialogTitle>{t("analysis.title")}</DialogTitle>
            <DialogDescription>
              <span className="font-mono break-words">{entry?.input}</span>
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {entry && analysis ? (
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-7">
                <SolverSolutionPanel
                  view="3d"
                  onViewChange={() => undefined}
                  hideViewSwitch
                  title={currentPhase ? currentPhase.phase : t("analysis.start")}
                  subtitle={t("analysis.rhythmNote")}
                  eyebrow={`${t("guide.step")} · ${String(cursor).padStart(2, "0")} / ${String(moves.length).padStart(2, "0")}`}
                  move={stepMove}
                  moveLabel={t("guide.step")}
                  turnCount={moves.length}
                  hasResult
                  cursor={cursor}
                  playing={playback.playing}
                  playbackSpeed={playback.playbackSpeed}
                  onTogglePlay={() => {
                    if (!playback.playing && cursor >= moves.length)
                      playback.selectCursor(0, "reset");
                    playback.setPlaying(!playback.playing);
                  }}
                  onStep={delta => playback.selectCursor(cursor + delta, "step")}
                  onReset={() => playback.selectCursor(0, "reset")}
                  onSeek={next => playback.selectCursor(next, "seek")}
                  onPlaybackSpeedChange={playback.setPlaybackSpeed}
                >
                  <SolutionStage
                    eventId="333"
                    puzzle="3x3x3"
                    setup={entry.input}
                    moves={moves}
                    cursor={cursor}
                    direction={playback.cubeMotion.direction}
                    motionId={playback.cubeMotion.id}
                    speed={playback.playbackSpeed}
                    language={language}
                  />
                </SolverSolutionPanel>
              </div>

              <div className="col-span-12 flex flex-col gap-4 lg:col-span-5">
                <section className="rounded-card bg-surface p-5">
                  <p className="mb-1 text-sm font-semibold tracking-wide text-muted uppercase">
                    {t("analysis.overview")}
                  </p>
                  <p className="mb-0 font-mono text-3xl font-bold tracking-tight">
                    {seconds(entry.elapsedMs)}
                  </p>
                  <p className="mb-0 text-sm text-muted">
                    {analysis.totalTurns} {t("analysis.turns")} ·{" "}
                    {analysis.tps ? `${analysis.tps.toFixed(2)} TPS` : "—"} ·{" "}
                    {t("analysis.recognitionTotal")} {seconds(analysis.recognitionMs)}
                  </p>
                </section>

                <section className="rounded-card bg-surface p-5">
                  <p className="mb-2 text-sm font-semibold tracking-wide text-muted uppercase">
                    {t("analysis.phases")}
                  </p>
                  <table className="w-full text-sm" data-testid="analysis-phases">
                    <thead>
                      <tr className="text-left text-muted">
                        <th className="pb-1 font-medium">{t("analysis.phase")}</th>
                        <th className="pb-1 font-medium">{t("analysis.turns")}</th>
                        <th className="pb-1 font-medium">{t("analysis.recognition")}</th>
                        <th className="pb-1 font-medium">{t("analysis.execution")}</th>
                        <th className="pb-1 font-medium">TPS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.phases.map(phase => (
                        <tr key={phase.phase}>
                          <td className="py-1">
                            <button
                              type="button"
                              className="font-semibold underline-offset-2 hover:underline disabled:no-underline"
                              disabled={phase.turns === 0}
                              onClick={() => playback.selectCursor(phase.end, "phase")}
                            >
                              {phase.phase}
                            </button>
                          </td>
                          <td className="py-1">{phase.turns}</td>
                          <td className="py-1">
                            {phase.recognitionMs === null ? "—" : seconds(phase.recognitionMs)}
                          </td>
                          <td className="py-1">
                            {phase.turns ? seconds(phase.executionMs) : "—"}
                          </td>
                          <td className="py-1">{phase.tps ? phase.tps.toFixed(2) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section className="rounded-card bg-surface p-5">
                  <p className="mb-1 text-sm font-semibold tracking-wide text-muted uppercase">
                    {t("analysis.pauses")}
                  </p>
                  {analysis.pauses.length ? (
                    <ul className="m-0 list-none p-0" data-testid="analysis-pauses">
                      {analysis.pauses.map(pause => (
                        <li key={pause.moveIndex} className="flex items-center justify-between py-1 text-sm">
                          <span>
                            {pause.phase} · {t("analysis.beforeMove")}{" "}
                            <span className="font-mono">{moves[pause.moveIndex]}</span>
                          </span>
                          <button
                            type="button"
                            className="font-semibold underline underline-offset-2"
                            onClick={() => playback.selectCursor(pause.moveIndex, "seek")}
                          >
                            {seconds(pause.gapMs)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mb-0 text-sm text-muted">{t("analysis.noPauses")}</p>
                  )}
                </section>

                <section className="rounded-card bg-surface p-5">
                  <p className="mb-1 text-sm font-semibold tracking-wide text-muted uppercase">
                    {t("analysis.cases")}
                  </p>
                  {cases ? (
                    <>
                      <CaseLine label="OLL" value={cases.oll} />
                      <CaseLine label="PLL" value={cases.pll} />
                    </>
                  ) : (
                    <p className="mb-0 text-sm text-muted">{t("common.loading")}</p>
                  )}
                </section>

                <section className="rounded-card bg-surface p-5">
                  <p className="mb-2 text-sm font-semibold tracking-wide text-muted uppercase">
                    {t("analysis.vsSolver")}
                  </p>
                  {comparison.status === "ready" ? (
                    <table className="w-full text-sm" data-testid="analysis-comparison">
                      <thead>
                        <tr className="text-left text-muted">
                          <th className="pb-1 font-medium">{t("analysis.phase")}</th>
                          <th className="pb-1 font-medium">{t("analysis.you")}</th>
                          <th className="pb-1 font-medium">{t("analysis.solver")}</th>
                          <th className="pb-1 font-medium">Δ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...PHASES, "total" as const].map(key => {
                          const mine =
                            key === "total"
                              ? analysis.totalTurns
                              : analysis.phases.find(item => item.phase === key)?.turns ?? 0;
                          const theirs =
                            key === "total"
                              ? comparison.comparison.total
                              : comparison.comparison.phases[key];
                          const delta = mine - theirs;
                          return (
                            <tr key={key}>
                              <td className="py-1 font-semibold">
                                {key === "total" ? t("analysis.total") : key}
                              </td>
                              <td className="py-1">{mine}</td>
                              <td className="py-1">{theirs}</td>
                              <td className="py-1">{delta > 0 ? `+${delta}` : delta}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <>
                      <p className="mb-3 text-sm text-muted">{t("analysis.vsSolverHint")}</p>
                      <Button
                        variant="soft"
                        size="sm"
                        disabled={comparison.status === "loading"}
                        aria-busy={comparison.status === "loading" || undefined}
                        onClick={() => void runComparison()}
                      >
                        {comparison.status === "loading"
                          ? t("otherPuzzles.solving")
                          : t("analysis.compare")}
                      </Button>
                      {comparison.status === "error" ? (
                        <p role="alert" className="mt-2 mb-0 text-sm text-danger">
                          {t("analysis.compareFailed")}
                        </p>
                      ) : null}
                    </>
                  )}
                </section>
              </div>
            </div>
          ) : (
            <div className="rounded-panel bg-surface-2 px-4 py-3 text-sm text-ink">
              {t("analysis.noData")}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" size="md" type="button" onClick={onClose}>
            {t("timer.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
