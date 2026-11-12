import { PuzzleScramblePreview } from "@/components/common/PuzzleScramblePreview";
import {
  SolveTimer,
  type TimerCompletion,
} from "@/components/common/SolveTimer";
import { PendingButton } from "@/components/ui/StudioUI";
import { formatMultiBlindTime, multiBlindResult } from "@/lib/multiBlind";
import type { TimerEventId } from "@/lib/timerEvents";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PendingSolve, RoomActiveRound } from "../lib/roomTypes";
import { Input } from "@/components/ui/FormControls";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/FormControls";
import { buttonClass } from "@/components/ui/Button";

type Props = {
  status: "waiting" | "active" | "finished";
  isHost: boolean;
  isSpectator: boolean;
  roundLimit: number;
  currentRound: number;
  eventId: TimerEventId;
  multiBlindCubes: number;
  activeRound: RoomActiveRound | null;
  submitted: boolean;
  myResultLabel: string;
  pendingMultiBlind: PendingSolve | null;
  multiBlindSolved: number;
  onMultiBlindSolvedChange: (value: number) => void;
  onComplete: (completion: TimerCompletion) => void;
  onStartRound: () => void;
  onFinish: () => void;
  onSubmitMultiBlind: () => void;
  startPending: boolean;
  finishPending: boolean;
  submitPending: boolean;
};

/** The round card: shared scramble, the timer, and the result submission. */
export function RoomRoundPanel({
  status,
  isHost,
  isSpectator,
  roundLimit,
  currentRound,
  eventId,
  multiBlindCubes,
  activeRound,
  submitted,
  myResultLabel,
  pendingMultiBlind,
  multiBlindSolved,
  onMultiBlindSolvedChange,
  onComplete,
  onStartRound,
  onFinish,
  onSubmitMultiBlind,
  startPending,
  finishPending,
  submitPending,
}: Props) {
  const { language, t } = useLanguage();
  const isMultiBlind = eventId === "333mbf";
  const mbState = pendingMultiBlind
    ? multiBlindResult(
        { attempted: multiBlindCubes, solved: multiBlindSolved },
        pendingMultiBlind.elapsedMs
      )
    : null;
  const liveContent = activeRound ? (
    <>
      {isMultiBlind ? (
        <div>
          <p>
            {t("rooms.round.bundle", {
              count: activeRound.scrambleBundle.length,
              limit: formatMultiBlindTime(
                multiBlindResult({ attempted: multiBlindCubes, solved: 0 }, 0)
                  .timeLimitMs
              ),
            })}
          </p>
          <ol className="divide-y divide-line overflow-hidden rounded-panel border border-line bg-surface list-decimal pl-6">
            {activeRound.scrambleBundle.map((scramble, index) => (
              <li
                key={`${index}-${scramble}`}
                className="block px-4 py-3 text-sm font-mono break-words"
              >
                {scramble}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <>
          <p className="text-xl font-bold break-words">
            {activeRound.scramble}
          </p>
          <PuzzleScramblePreview
            eventId={eventId}
            scramble={activeRound.scramble}
            language={language}
          />
        </>
      )}
    </>
  ) : (
    <p className="text-muted mb-0">{t("rooms.round.waitingHost")}</p>
  );

  return (
    <div className="rounded-card border border-line/80 bg-surface shadow-soft">
      <div className="p-5 sm:p-6">
        {status === "finished" ? (
          <div className="rounded-panel border px-4 py-3 text-sm border-success/20 bg-success-soft text-ink mb-0">
            {t("rooms.round.finished")}{" "}
            {isHost ? t("rooms.round.finishedHost") : ""}
          </div>
        ) : activeRound ? (
          <>
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-muted text-sm">
                  {t("rooms.round.counter", {
                    current: activeRound.sequence,
                    limit: roundLimit,
                  })}
                </p>
                {liveContent}
              </div>
              {isHost && activeRound.sequence < roundLimit ? (
                <PendingButton
                  type="button"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-primary/35 bg-transparent text-primary hover:bg-primary-soft self-start"
                  pending={startPending}
                  onClick={onStartRound}
                >
                  {t("rooms.round.next")}
                </PendingButton>
              ) : null}
            </div>
            <hr />
            {isSpectator ? (
              <div className="rounded-panel border px-4 py-3 text-sm border-line bg-surface-2 text-ink mb-0">
                {t("rooms.round.spectating")}
              </div>
            ) : isMultiBlind ? (
              submitted ? (
                <div className="rounded-panel border px-4 py-3 text-sm border-success/20 bg-success-soft text-ink">
                  {t("rooms.round.submitted", { result: myResultLabel })}
                </div>
              ) : pendingMultiBlind ? (
                <div className="rounded-card border border-line/80 bg-surface shadow-soft bg-surface-2">
                  <div className="p-5 sm:p-6">
                    <h2 className="text-sm font-semibold tracking-tight">
                      {t("rooms.round.mbldTitle")}
                    </h2>
                    <label className="mb-1.5 block text-sm font-medium text-ink">
                      {t("rooms.round.mbldSolved")}
                      <Input
                        className="mt-1"
                        type="number"

                        min={0}
                        max={multiBlindCubes}
                        value={multiBlindSolved}
                        onChange={input =>
                          onMultiBlindSolvedChange(
                            Math.max(
                              0,
                              Math.min(
                                multiBlindCubes,
                                Number(input.target.value) || 0
                              )
                            )
                          )
                        }
                      />
                    </label>
                    <p>
                      {t("rooms.round.mbldScore", {
                        score: mbState?.score ?? 0,
                        unsolved: mbState?.unsolved ?? multiBlindCubes,
                      })}
                    </p>
                    <PendingButton
                      type="button"
                      className={`${buttonClass("primary", "md")}`}
                      pending={submitPending}
                      onClick={onSubmitMultiBlind}
                    >
                      {t("rooms.round.mbldSubmit")}
                    </PendingButton>
                  </div>
                </div>
              ) : (
                <SolveTimer
                  key={activeRound.id}
                  onComplete={onComplete}
                  soundEnabled
                />
              )
            ) : submitted ? (
              <div className="rounded-panel border px-4 py-3 text-sm border-success/20 bg-success-soft text-ink">
                {t("rooms.round.submitted", { result: myResultLabel })}
              </div>
            ) : (
              <SolveTimer
                key={activeRound.id}
                onComplete={onComplete}
                soundEnabled
              />
            )}
          </>
        ) : (
          <div className="rounded-panel border px-4 py-3 text-sm border-line bg-surface-2 text-ink mb-0">
            <h2 className="text-base font-semibold tracking-tight">
              {t("rooms.round.waitingTitle")}
            </h2>
            {isHost ? (
              <div className="flex gap-2">
                <PendingButton
                  type="button"
                  className={`${buttonClass("primary", "md")}`}
                  pending={startPending}
                  onClick={onStartRound}
                >
                  {t("rooms.round.start")}
                </PendingButton>
                {currentRound ? (
                  <PendingButton
                    type="button"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-success/35 bg-transparent text-success hover:bg-success-soft"
                    pending={finishPending}
                    onClick={onFinish}
                  >
                    {t("rooms.round.finish")}
                  </PendingButton>
                ) : null}
              </div>
            ) : (
              <p className="mb-0">{t("rooms.round.waitingHostShort")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
