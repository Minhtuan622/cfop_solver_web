import { PuzzleScramblePreview } from "@/components/common/PuzzleScramblePreview";
import { SolveTimer, type TimerCompletion } from "@/components/common/SolveTimer";
import { formatMultiBlindTime, multiBlindResult } from "@/lib/multiBlind";
import type { TimerEventId } from "@/lib/timerEvents";
import type { PendingSolve, RoomActiveRound } from "../lib/roomTypes";

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
}: Props) {
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
            Bundle MBLD · {activeRound.scrambleBundle.length} khối · giới hạn{" "}
            {formatMultiBlindTime(
              multiBlindResult(
                { attempted: multiBlindCubes, solved: 0 },
                0
              ).timeLimitMs
            )}
          </p>
          <ol className="list-group list-group-numbered">
            {activeRound.scrambleBundle.map((scramble, index) => (
              <li
                key={`${index}-${scramble}`}
                className="list-group-item font-monospace small text-break"
              >
                {scramble}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <>
          <p className="fs-4 fw-bold text-break">{activeRound.scramble}</p>
          <PuzzleScramblePreview
            eventId={eventId}
            scramble={activeRound.scramble}
            language="vi"
          />
        </>
      )}
    </>
  ) : (
    <p className="text-body-secondary mb-0">Đang chờ chủ phòng bắt đầu lượt.</p>
  );

  return (
    <div className="card">
      <div className="card-body">
        {status === "finished" ? (
          <div className="alert alert-success mb-0">
            Phòng đã hoàn tất.{" "}
            {isHost ? "Bạn có thể Đấu lại hoặc Xóa phòng." : ""}
          </div>
        ) : activeRound ? (
          <>
            <div className="d-flex justify-content-between gap-3">
              <div>
                <p className="text-body-secondary small">
                  Lượt {activeRound.sequence}/{roundLimit} · Scramble chung
                </p>
                {liveContent}
              </div>
              {isHost && activeRound.sequence < roundLimit ? (
                <button
                  className="btn btn-outline-primary align-self-start"
                  onClick={onStartRound}
                >
                  Lượt tiếp
                </button>
              ) : null}
            </div>
            <hr />
            {isSpectator ? (
              <div className="alert alert-secondary mb-0">
                Chế độ xem trực tiếp đang hoạt động. Kết quả sẽ tự cập nhật.
              </div>
            ) : isMultiBlind ? (
              submitted ? (
                <div className="alert alert-success">
                  Đã nộp: {myResultLabel}
                </div>
              ) : pendingMultiBlind ? (
                <div className="card bg-body-tertiary">
                  <div className="card-body">
                    <h2 className="h6">Kết quả Multi-Blind</h2>
                    <label className="form-label">
                      Số khối giải đúng
                      <input
                        type="number"
                        className="form-control mt-1"
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
                      Score: {mbState?.score ?? 0} · Unsolved:{" "}
                      {mbState?.unsolved ?? multiBlindCubes}
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={onSubmitMultiBlind}
                    >
                      Nộp score MBLD
                    </button>
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
              <div className="alert alert-success">
                Đã nộp: {myResultLabel}
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
          <div className="alert alert-secondary mb-0">
            <h2 className="h5">Đang chờ lượt</h2>
            {isHost ? (
              <div className="d-flex gap-2">
                <button className="btn btn-primary" onClick={onStartRound}>
                  Bắt đầu lượt
                </button>
                {currentRound ? (
                  <button
                    className="btn btn-outline-success"
                    onClick={onFinish}
                  >
                    Hoàn tất thể thức
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="mb-0">Đợi chủ phòng bắt đầu lượt.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
