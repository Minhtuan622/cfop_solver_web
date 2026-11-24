/** Thẻ chi tiết của một chỉ số (single/ao5/ao12…): các lượt tạo nên chỉ số và khối sau khi tráo. */
import { ClipboardCheck, ImageDown, Play } from "@/components/ui/Icon";
import { useMemo } from "react";
import { CubeNet } from "@/components/common/CubeNet";
import { validateRecordedSolution } from "@/lib/fastCube";
import { isThreeByThreeEvent, normalizeTimerEventId } from "@/lib/timerEvents";
import { splitSummary } from "../lib/timerAnalysis";
import { formatSolveResult, initialStateFor, type SolveHistoryEntry } from "@/lib/solveHistory";
import { useLanguage } from "@/contexts/LanguageContext";
import { IconButton } from "@/components/ui/StudioUI";
import { Button } from "@/components/ui/Button";

import { buttonClass } from "@/components/ui/Button";

import { safeScrambleState } from "../lib/timerScrambleState";
import { exportSolveImage } from "../lib/timerImageExport";

export function MetricDetailCard({
  entry,
  exclusion,
  showCubeNet,
  copied,
  onCopy,
  onExpand,
  onReplay,
  onAnalyze,
}: {
  entry: SolveHistoryEntry;
  exclusion?: "best" | "worst";
  showCubeNet: boolean;
  copied: boolean;
  onCopy: (entry: SolveHistoryEntry) => void;
  onExpand: (entry: SolveHistoryEntry) => void;
  onReplay: (entry: SolveHistoryEntry) => void;
  /** Mở phân tích sâu; chỉ hiện với solve smart cube có nhịp từng nước. */
  onAnalyze?: (entry: SolveHistoryEntry) => void;
}) {
  const { language, t } = useLanguage();
  const isThreeByThree = isThreeByThreeEvent(
    normalizeTimerEventId(entry.eventId)
  );
  const state = useMemo(
    () => safeScrambleState(entry.input, entry.eventId),
    [entry.input, entry.eventId]
  );
  const solution = useMemo(
    () =>
      isThreeByThree
        ? validateRecordedSolution(initialStateFor(entry), entry.solution)
        : null,
    [entry, isThreeByThree]
  );
  const canReplay = Boolean(solution?.valid && solution.moves.length > 0);
  return (
    <article className="block px-4 py-3 text-sm">
      <div className="grid grid-cols-12 gap-4 items-center">
        {isThreeByThree && showCubeNet && (
          <div className="col-span-12">
            <Button
              variant="secondary"
              size="xs"
              type="button"
              onClick={() => onExpand(entry)}
              aria-label={t("timer.enlargeCubeNet")}
            >
              <CubeNet state={state} compact />
            </Button>
          </div>
        )}
        <div className="col-span-12">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <strong className="text-lg">{formatSolveResult(entry)}</strong>
              <small className="block text-muted">
                {new Date(entry.createdAt).toLocaleString(
                  language === "vi" ? "vi-VN" : "en-US"
                )}
              </small>
            </div>
            <div className="flex flex-wrap gap-1">
              {entry.penalty !== "none" && (
                <span
                  className={
                    entry.penalty === "DNF"
                      ? "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-danger text-on-danger"
                      : "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-warning text-on-warning"
                  }
                >
                  {entry.penalty}
                </span>
              )}
              {entry.source === "bluetooth" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-info-soft px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide text-ink">
                  BLE
                </span>
              )}
              {entry.source === "smartcube" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-info-soft px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide text-ink">
                  CUBE
                </span>
              )}
              {exclusion && (
                <span
                  className={
                    exclusion === "best"
                      ? "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-success text-on-success"
                      : "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-danger text-on-danger"
                  }
                >
                  {exclusion === "best"
                    ? t("timer.bestDiscarded")
                    : t("timer.worstDiscarded")}
                </span>
              )}
            </div>
          </div>
          <p className="font-mono break-words mt-2 mb-2">{entry.input}</p>
          {entry.phaseSplits.length > 0 || entry.moves > 0 ? (
            <p className="text-xs text-muted mb-1 font-mono">
              {entry.phaseSplits.length ? `${splitSummary(entry)} · ` : ""}
              {entry.moves} moves ·{" "}
              {(entry.moves / (entry.elapsedMs / 1000)).toFixed(2)} TPS
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <IconButton
              label={
                copied ? t("timer.scrambleCopied") : t("timer.copyScramble")
              }
              icon={<ClipboardCheck className="text-lg" />}
              onClick={() => onCopy(entry)}
              className={`${buttonClass("secondary", "sm")}`}
            />
            {canReplay ? (
              <IconButton
                label={t("timer.playSolution")}
                icon={<Play className="text-lg" />}
                onClick={() => onReplay(entry)}
                className={`${buttonClass("secondary", "sm")}`}
              />
            ) : (
              <span className="text-sm text-muted">
                {isThreeByThree
                  ? t("timer.noSavedSolution")
                  : t("timer.replayOnlyThree")}
              </span>
            )}
            {entry.moveTimes && onAnalyze ? (
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => onAnalyze(entry)}
              >
                {t("analysis.open")}
              </Button>
            ) : null}
            <IconButton
              label={t("timer.shareSolveImage")}
              icon={<ImageDown className="text-lg" />}
              onClick={() => exportSolveImage(entry, language)}
              className={`${buttonClass("secondary", "sm")}`}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
