/* Tailwind-only Study exercise: sighted execution before blindfolded recall, using the existing fast cube trace. */
import { ArrowLeft, ArrowRight, Check, Redo2 } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/StudioUI";
import { Cube3DGuide } from "@/components/common/Cube3DGuide";
import type { StarterFormula } from "@/features/bld";
import { SOLVED_FAST_STATE, traceFastMoves } from "@/lib/fastCube";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { buttonClass } from "@/components/ui/Button";

export function BldSightedCommutator({
  formula,
  language,
  onGrade,
}: {
  formula: StarterFormula;
  language: "vi" | "en";
  onGrade: (remembered: boolean) => void;
}) {
  const vi = language === "vi";
  const [cursor, setCursor] = useState(0);
  const trace = useMemo(() => {
    try {
      return traceFastMoves(SOLVED_FAST_STATE, formula.algorithm);
    } catch {
      return null;
    }
  }, [formula.algorithm]);
  useEffect(() => setCursor(0), [formula.algorithm]);
  if (!trace)
    return (
      <section className="rounded-card border border-line/80 bg-surface shadow-soft mb-6">
        <div className="p-5 sm:p-6">
          <h3 className="text-sm font-semibold tracking-tight">
            {vi ? "Bài sighted-commutator" : "Sighted-commutator exercise"}
          </h3>
          <div className="rounded-panel border px-4 py-3 text-sm border-warning/25 bg-warning-soft text-ink mb-0">
            {vi
              ? "Notation của case này chưa chạy được trên Cube 3D. Hãy chọn một starter case khác để luyện mở mắt."
              : "This case cannot run on the 3D Cube yet. Choose another starter case for sighted practice."}
          </div>
        </div>
      </section>
    );
  const current =
    cursor === 0
      ? {
          state: SOLVED_FAST_STATE,
          previousState: SOLVED_FAST_STATE,
          move: undefined,
        }
      : trace[cursor - 1];
  const complete = cursor === trace.length;
  return (
    <section className="rounded-card border border-line/80 bg-surface shadow-soft mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <p className="text-sm uppercase tracking-wide font-semibold text-muted mb-1">
          {vi ? "BÀI THỰC HÀNH MỞ MẮT" : "SIGHTED PRACTICE"}
        </p>
        <h3 className="text-sm font-semibold tracking-tight mb-0">
          {vi
            ? "Chạy commutator từng nước trước khi ghi nhớ."
            : "Run the commutator one move at a time before memorizing."}
        </h3>
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-sm text-muted">
          {vi
            ? "Nhìn Cube 3D, nói to nước sắp quay, rồi bấm nước kế. Đây là bước luyện execution; bạn chưa cần bịt mắt."
            : "Watch the 3D Cube, say the next move aloud, then advance. This trains execution; you do not need a blindfold yet."}
        </p>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-7">
            <Cube3DGuide
              state={current.state}
              previousState={current.previousState}
              move={current.move}
              step={cursor}
              transition={cursor ? "move" : "idle"}
              transitionId={cursor}
              turnDurationMs={260}
              initialOrbit={-28}
              initialPitch={-14}
            />
          </div>
          <div className="col-span-12 md:col-span-5">
            <div className="rounded-card border border-line/80 bg-surface shadow-soft bg-surface-2 h-full">
              <div className="p-5 sm:p-6">
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-3 text-ink">
                  {formula.kind.toUpperCase()} · {formula.key}
                </span>
                <p className="font-mono text-sm break-words mt-4 mb-4">
                  {formula.algorithm}
                </p>
                <p className="text-sm mb-1">{vi ? "Tiến độ" : "Progress"}</p>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-surface-3 mb-4"
                  aria-label={
                    vi
                      ? "Tiến độ sighted commutator"
                      : "Sighted commutator progress"
                  }
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{
                      width: `${trace.length ? (cursor / trace.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-sm text-muted mb-0">
                  {complete
                    ? vi
                      ? "Đã chạy hết. Tự chấm để đưa case vào lịch SRS."
                      : "Complete. Self-grade to send this case to SRS."
                    : vi
                      ? `Nước kế: ${trace[cursor]?.move ?? "—"}`
                      : `Next move: ${trace[cursor]?.move ?? "—"}`}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
          <div
            className="inline-flex flex-wrap items-center gap-1"
            role="group"
            aria-label={
              vi
                ? "Điều khiển bài sighted commutator"
                : "Sighted commutator controls"
            }
          >
            <IconButton
              label={vi ? "Nước trước bài mở mắt" : "Previous sighted move"}
              icon={<ArrowLeft className="text-base" />}
              onClick={() => setCursor(value => Math.max(0, value - 1))}
              disabled={!cursor}
              className={`${buttonClass("secondary", "md")}`}
            />
            <IconButton
              label={vi ? "Chạy lại bài mở mắt" : "Restart sighted practice"}
              icon={<Redo2 className="text-base" />}
              onClick={() => setCursor(0)}
              className={`${buttonClass("secondary", "md")}`}
            />
            <IconButton
              label={vi ? "Nước kế bài mở mắt" : "Next sighted move"}
              icon={<ArrowRight className="text-base" />}
              onClick={() =>
                setCursor(value => Math.min(trace.length, value + 1))
              }
              disabled={complete}
              className={`${buttonClass("primary", "md")}`}
            />
          </div>
          {complete && (
            <div
              className="inline-flex flex-wrap items-center gap-1"
              role="group"
              aria-label={
                vi
                  ? "Tự chấm bài sighted commutator"
                  : "Grade sighted commutator"
              }
            >
              <Button
                variant="danger"
                size="sm"
                type="button"
                onClick={() => {
                  onGrade(false);
                  setCursor(0);
                }}
              >
                {vi ? "Chưa đúng" : "Not yet"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={() => onGrade(true)}
              >
                <Check className="text-base mr-1" />
                {vi ? "Đã chạy đúng" : "I ran it correctly"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
