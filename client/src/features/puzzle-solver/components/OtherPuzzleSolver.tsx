/**
 * Phần thân trang Giải cho các khối ngoài 3×3 (2×2×2, Pyraminx, Skewb): dùng lại
 * đúng các panel của trang Giải 3×3 (nhập scramble, sân khấu 3D có thanh phát,
 * cột lời giải), chỉ khác bộ giải bên dưới là cubing/search.
 */
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SolutionStage } from "./SolutionStage";
import { PuzzleStatePainter } from "./PuzzleStatePainter";
import { ClockDialEditor } from "./ClockDialEditor";
import { CLOCK_DIAL_COUNT } from "../lib/clockEngine";
import { invertClockAlgorithm } from "../lib/clockSolver";
import { PanelHeader, Surface } from "@/components/ui/DesignSystem";
import { PencilSquare, Play } from "@/components/ui/Icon";
import {
  loadStateModel,
  solveFromPainting,
  solvedStatePainting,
} from "../lib/stateSolve";
import type { KPuzzleId, Painting, StateModel } from "../lib/puzzleState";
import { SolverInputPanel } from "@/features/solver/components/SolverInputPanel";
import { SolverSolutionPanel } from "@/features/solver/components/SolverSolutionPanel";
import { SolverSolutionSidebar } from "@/features/solver/components/SolverSolutionSidebar";
import { useSolverPlayback } from "@/features/solver/lib/useSolverPlayback";
import { useLanguage } from "@/contexts/LanguageContext";
import { generateTimerScramble } from "@/lib/timerEvents";
import { cn } from "@/lib/utils";
import {
  OTHER_PUZZLES,
  PuzzleSolveError,
  solveOtherPuzzle,
  type OtherPuzzleId,
  type PuzzleSolveResult,
} from "../lib/puzzleSolve";

/** `puzzle` đổi thì cha đặt `key` mới để scramble và kết quả cũ bị bỏ. */
export function OtherPuzzleSolver({
  puzzle,
  mode = "scramble",
}: {
  puzzle: OtherPuzzleId;
  /** Nhập bằng scramble hoặc tô màu trạng thái. */
  mode?: "scramble" | "state";
}) {
  const { language, t } = useLanguage();
  const info = OTHER_PUZZLES[puzzle];
  const [scramble, setScramble] = useState("");
  const [result, setResult] = useState<PuzzleSolveResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const kpuzzleId = info.puzzle as KPuzzleId;
  const [model, setModel] = useState<StateModel | null>(null);
  const [painting, setPainting] = useState<Painting>({});
  const [brush, setBrush] = useState("");
  const isClock = puzzle === "clock";
  const [dials, setDials] = useState<number[]>(() => new Array(CLOCK_DIAL_COUNT).fill(0));

  const moves = useMemo(
    () => (result?.solution ? result.solution.split(" ") : []),
    [result]
  );
  // Bộ phát chung của trang Giải chỉ cần độ dài lời giải.
  const source = useMemo(
    () => (result ? { trace: moves } : null),
    [result, moves]
  );
  const playback = useSolverPlayback(source);

  // Mở khối nào là có sẵn scramble của khối đó (như trang 3×3), khỏi bấm tạo.
  useEffect(() => {
    let cancelled = false;
    void generateTimerScramble(info.scrambleEventId).then(next => {
      if (!cancelled) setScramble(current => current || next);
    });
    return () => {
      cancelled = true;
    };
  }, [info.scrambleEventId]);

  // Vào chế độ tô màu thì tải mô hình sticker (nạp lười) và bắt đầu từ khối đã giải.
  useEffect(() => {
    if (mode !== "state" || model || isClock) return;
    let cancelled = false;
    void Promise.all([loadStateModel(kpuzzleId), solvedStatePainting(kpuzzleId)])
      .then(([loaded, solved]) => {
        if (cancelled) return;
        setModel(loaded);
        setPainting(solved);
        setBrush(loaded.faces[0]?.name ?? "");
      })
      .catch(() => {
        if (!cancelled) setError(t("otherPuzzles.error.solver-failed"));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, kpuzzleId, model]);

  const solveState = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    playback.setPlaying(false);
    playback.setCursor(0);
    try {
      if (isClock) {
        const { solveClockDials } = await import("../lib/clockEngine");
        const solution = await solveClockDials(dials);
        if (solution === null) throw new PuzzleSolveError("invalid-state");
        setResult({
          scramble: invertClockAlgorithm(solution),
          solution,
          moves: solution ? solution.split(" ").length : 0,
        });
        return;
      }
      const solved = await solveFromPainting(puzzle, painting);
      setResult({
        scramble: solved.setup,
        solution: solved.solution,
        moves: solved.solution ? solved.solution.split(" ").length : 0,
        ...(solved.phases ? { phases: solved.phases } : {}),
      });
    } catch (reason) {
      const code =
        reason instanceof PuzzleSolveError ? reason.code : "solver-failed";
      setError(t(`otherPuzzles.error.${code}`));
    } finally {
      setLoading(false);
    }
  };

  const solve = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    playback.setPlaying(false);
    playback.setCursor(0);
    try {
      setResult(await solveOtherPuzzle(puzzle, scramble));
    } catch (reason) {
      const code =
        reason instanceof PuzzleSolveError ? reason.code : "solver-failed";
      setError(t(`otherPuzzles.error.${code}`));
    } finally {
      setLoading(false);
    }
  };

  const randomScramble = async () => {
    setError("");
    setScramble(await generateTimerScramble(info.scrambleEventId));
    setResult(null);
    playback.setCursor(0);
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard?.writeText(result.solution);
      setCopied(true);
      setTimeout(() => setCopied(false), 1_500);
    } catch {
      /* Trình duyệt chặn clipboard: người dùng vẫn chọn chữ được. */
    }
  };

  const cursor = playback.cursor;
  const stepMove = cursor > 0 ? (moves[cursor - 1] ?? "") : "";

  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
        {mode === "state" ? (
          <Surface>
            <PanelHeader
              className="px-6 pt-6 pb-2"
              icon={<PencilSquare />}
              title={t("home.inputTitle.state")}
            />
            <div className="px-6 pb-6">
              {isClock ? (
                <ClockDialEditor
                  dials={dials}
                  disabled={loading}
                  onChange={next => {
                    setDials(next);
                    setResult(null);
                    playback.setCursor(0);
                  }}
                  onReset={() => {
                    setDials(new Array(CLOCK_DIAL_COUNT).fill(0));
                    setResult(null);
                    playback.setCursor(0);
                  }}
                />
              ) : model ? (
                <PuzzleStatePainter
                  kpuzzleId={kpuzzleId}
                  model={model}
                  painting={painting}
                  onChange={next => {
                    setPainting(next);
                    setResult(null);
                    playback.setCursor(0);
                  }}
                  brush={brush}
                  onBrushChange={setBrush}
                  onReset={() => {
                    void solvedStatePainting(kpuzzleId).then(setPainting);
                    setResult(null);
                    playback.setCursor(0);
                  }}
                  disabled={loading}
                />
              ) : (
                <p className="mb-0 text-sm text-muted">{t("common.loading")}</p>
              )}
              <Button
                variant="primary"
                className="mt-4 w-full px-6 py-3 text-base"
                disabled={(!isClock && !model) || loading}
                aria-busy={loading || undefined}
                onClick={() => void solveState()}
              >
                <Play className="text-lg mr-1" aria-hidden="true" />
                {loading ? t("otherPuzzles.solving") : t("input.solve")}
              </Button>
              {error ? (
                <p role="alert" className="mt-3 mb-0 text-sm text-danger">
                  {error}
                </p>
              ) : null}
            </div>
          </Surface>
        ) : (
        <SolverInputPanel
          solverKind="cfop"
          mode="scramble"
          value={scramble}
          loading={loading}
          status={t("otherPuzzles.solving")}
          error={error}
          stateValidation={null}
          recentStates={[]}
          hideCamera
          scramblePlaceholder={t("otherPuzzles.scramblePlaceholder")}
          onValueChange={next => {
            setScramble(next);
            setResult(null);
            playback.setCursor(0);
          }}
          onStateEdit={() => undefined}
          onRandomScramble={() => void randomScramble()}
          onSolve={() => void solve()}
          onCancel={() => undefined}
          onSelectRecentState={() => undefined}
          onRemoveRecentState={() => undefined}
          onCameraState={() => undefined}
        />
        )}

        {/* Chế độ Trạng thái: chỉ hiện khu vực khối sau khi đã giải. */}
        {mode === "state" && !result ? null : (
        <SolverSolutionPanel
          view="3d"
          onViewChange={() => undefined}
          hideViewSwitch
          title={t(info.labelKey)}
          subtitle={t("otherPuzzles.note")}
          eyebrow={
            result
              ? `${t("guide.step")} · ${String(cursor).padStart(2, "0")} / ${String(moves.length).padStart(2, "0")}`
              : undefined
          }
          move={stepMove || null}
          moveLabel={t("guide.step")}
          turnCount={moves.length}
          hasResult={Boolean(result?.solution)}
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
            eventId={info.eventId}
            puzzle={info.puzzle}
            setup={result?.scramble ?? (mode === "scramble" ? scramble : "")}
            moves={moves}
            cursor={cursor}
            direction={playback.cubeMotion.direction}
            motionId={playback.cubeMotion.id}
            speed={playback.playbackSpeed}
            language={language}
            placeholder={t("otherPuzzles.stagePlaceholder")}
          />
        </SolverSolutionPanel>
        )}
      </div>

      <SolverSolutionSidebar>
        {result ? (
          <div className="flex flex-col gap-3">
            <p className="mb-0 text-sm text-muted">
              {t("otherPuzzles.moves")}:{" "}
              <strong className="text-ink">{result.moves}</strong>
            </p>
            {moves.length ? (
              <div data-testid="other-puzzle-solution" className="flex flex-col gap-4">
                {(result.phases ?? [{ name: "", moves }]).map((phase, phaseIndex, list) => {
                  const offset = list
                    .slice(0, phaseIndex)
                    .reduce((sum, item) => sum + item.moves.length, 0);
                  if (!phase.moves.length) return null;
                  return (
                    <section key={phaseIndex}>
                      {phase.name ? (
                        <h3 className="mb-2 text-sm font-semibold tracking-tight">
                          {t(`roux.phase.${phase.name}`)}{" "}
                          <span className="font-normal text-muted">
                            · {phase.moves.length}
                          </span>
                        </h3>
                      ) : null}
                      <ol className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                        {phase.moves.map((move, index) => {
                          const position = offset + index + 1;
                          return (
                            <li key={index}>
                              <button
                                type="button"
                                aria-current={cursor === position || undefined}
                                onClick={() => playback.selectCursor(position, "seek")}
                                className={cn(
                                  "rounded-full px-3 py-1.5 font-mono text-sm transition",
                                  cursor === position
                                    ? "bg-primary text-on-primary"
                                    : "bg-surface-2 text-ink hover:bg-surface-3"
                                )}
                              >
                                {move}
                              </button>
                            </li>
                          );
                        })}
                      </ol>
                    </section>
                  );
                })}
              </div>
            ) : (
              <p
                data-testid="other-puzzle-solution"
                className="mb-0 text-sm text-ink"
              >
                {t("otherPuzzles.alreadySolved")}
              </p>
            )}
            <div>
              <Button variant="soft" size="sm" onClick={() => void copy()}>
                {copied ? t("otherPuzzles.copied") : t("otherPuzzles.copy")}
              </Button>
            </div>
          </div>
        ) : undefined}
      </SolverSolutionSidebar>
    </div>
  );
}
