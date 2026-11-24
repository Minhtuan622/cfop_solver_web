import { Play, Timer } from "@/components/ui/Icon";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PuzzleScramblePreview } from "@/components/common/PuzzleScramblePreview";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/StudioDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SolveHistoryEntry } from "@/lib/solveHistory";
import { normalizeTimerEventId } from "@/lib/timerEvents";
import type { phaseTpsFromSolution } from "../lib/timerAnalysis";

export function TimerReplayDialog({
  replay,
  replayText,
  replayTps,
  phaseTps,
  replayRunId,
  onPlay,
  onClose,
  onAnalyze,
}: {
  replay: SolveHistoryEntry | null;
  replayText: string;
  replayTps: number;
  phaseTps: ReturnType<typeof phaseTpsFromSolution>;
  replayRunId: number;
  onPlay: () => void;
  onClose: () => void;
  onAnalyze?: (entry: SolveHistoryEntry) => void;
}) {
  const { language, t } = useLanguage();
  return (
    <Dialog
      open={Boolean(replay)}
      onOpenChange={open => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <div>
            <DialogTitle>{t("timer.playbackTitle")}</DialogTitle>
            <DialogDescription>
              <span className="font-mono break-words">
                {replayText}
              </span>
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {replayText.trim() ? (
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-7">
                {replay?.inputKind === "scramble" ? (
                  <div className="min-h-[16rem] h-full rounded-card overflow-hidden">
                    <PuzzleScramblePreview
                      eventId={normalizeTimerEventId(replay?.eventId)}
                      scramble={replay?.input ?? ""}
                      language={language}
                      animationAlg={replayText}
                      animationRunId={replayRunId}
                    />
                  </div>
                ) : (
                  <div className="rounded-card bg-surface h-full flex flex-col items-center justify-center text-center p-5 sm:p-6">
                    <Timer className="text-4xl text-muted mb-4" />
                    <p className="text-sm text-muted mb-0">
                      {t("timer.replayStateSolve")}
                    </p>
                  </div>
                )}
              </div>
              <div className="col-span-12 lg:col-span-5">
                <div className="rounded-card bg-surface h-full">
                  <div className="p-5 sm:p-6">
                    <p className="text-sm uppercase tracking-wide font-semibold text-muted mb-1">
                      {t("timer.moves")}
                    </p>
                    <p className="text-3xl font-bold tracking-tight sm:text-4xl font-mono">
                      {replay?.moves ?? 0}
                    </p>
                    <p className="text-sm text-muted">
                      {t("timer.tps")} {replayTps.toFixed(2)}
                    </p>
                    {replay?.phaseSplits.length ? (
                      <div className="mt-4">
                        <p className="text-sm font-semibold mb-1">
                          {t("timer.splitTimes")}
                        </p>
                        <div className="grid grid-cols-12 gap-1">
                          {replay.phaseSplits.map(split => (
                            <div
                              key={split.phase}
                              className="col-span-6"
                            >
                              <span className="text-sm text-muted">
                                {split.phase}{" "}
                              </span>
                              <strong className="text-sm">
                                {(split.elapsedMs / 1000).toFixed(2)}s
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {phaseTps.length ? (
                      <div className="mt-4">
                        <p className="text-sm font-semibold mb-1">
                          {t("timer.tpsByPhase")}
                        </p>
                        <div className="h-64">
                          <ResponsiveContainer
                            width="100%"
                            height="100%"
                          >
                            <BarChart data={phaseTps}>
                              <XAxis
                                dataKey="phase"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9 }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9 }}
                                width={24}
                              />
                              <Tooltip
                                formatter={value => [
                                  `${Number(value).toFixed(2)} TPS`,
                                  t("timer.tps"),
                                ]}
                              />
                              <Bar
                                dataKey="tps"
                                fill="var(--chart-1)"
                                radius={[2, 2, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-panel px-4 py-3 text-sm bg-surface-2 text-ink py-2 mt-4 mb-0">
                        {t("timer.tpsEmpty")}
                      </div>
                    )}
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full mt-4 gap-1"
                      type="button"
                      onClick={onPlay}
                    >
                      <Play className="text-base mr-1" />
                      {t("timer.playSolution")}
                    </Button>
                    {replay?.moveTimes && onAnalyze ? (
                      <Button
                        variant="secondary"
                        size="md"
                        className="w-full mt-2"
                        type="button"
                        onClick={() => onAnalyze(replay)}
                      >
                        {t("analysis.open")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-panel px-4 py-3 text-sm bg-surface-2 text-ink mb-0">
              {t("timer.noSolution")}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            size="md"
            type="button"
            onClick={onClose}
          >
            {t("timer.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
