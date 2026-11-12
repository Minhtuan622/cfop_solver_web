/* Tailwind-first self-check: the target state is the inverse of the chosen starter algorithm. */
import type { StarterFormula } from "@/features/bld";
import { Check, Dices } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/StudioUI";
import {
  parseFastMoves,
  stateFromScramble,
  validateRecordedSolution,
} from "@/lib/fastCube";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { Select } from "@/components/ui/FormControls";
import { Textarea } from "@/components/ui/FormControls";
import { buttonClass } from "@/components/ui/Button";

function inverseAlgorithm(algorithm: string) {
  return parseFastMoves(algorithm)
    .reverse()
    .map(move =>
      move.endsWith("2")
        ? move
        : move.endsWith("'")
          ? move.slice(0, -1)
          : `${move}'`
    )
    .join(" ");
}

export function BldTargetSelfCheck({
  formula,
  language,
}: {
  formula: StarterFormula;
  language: "vi" | "en";
}) {
  const vi = language === "vi";
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<"idle" | "pass" | "wrong" | "invalid">(
    "idle"
  );
  const [aufCursor, setAufCursor] = useState(0);
  const auf = ["U", "U2", "U'"][aufCursor % 3];
  const target = useMemo(() => {
    try {
      const scramble = `${inverseAlgorithm(formula.algorithm)} ${auf}`;
      return { scramble, state: stateFromScramble(scramble) };
    } catch {
      return null;
    }
  }, [formula.algorithm, auf]);
  useEffect(() => {
    setAnswer("");
    setResult("idle");
  }, [formula.algorithm]);
  const nextAuf = () => {
    setAufCursor(current => current + 1);
    setAnswer("");
    setResult("idle");
  };
  const check = () => {
    if (!target) {
      setResult("invalid");
      return;
    }
    const validation = validateRecordedSolution(target.state, answer);
    setResult(
      validation.valid && validation.moves.length
        ? "pass"
        : validation.error === "unsupported"
          ? "invalid"
          : "wrong"
    );
  };
  return (
    <section className="rounded-card border border-line/80 bg-surface shadow-soft bg-surface-2 mb-6">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm uppercase tracking-wide font-semibold text-muted mb-1">
              {vi ? "TỰ KIỂM · AUF" : "SELF-CHECK · AUF"}
            </p>
            <h4 className="text-sm font-semibold tracking-tight mb-0">
              {vi
                ? "Giải target scramble bằng công thức vừa chọn"
                : "Solve the target scramble with the selected algorithm"}
            </h4>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-3 text-ink">
            {formula.kind.toUpperCase()} · {formula.key}
          </span>
        </div>
        <p className="text-sm text-muted mt-4 mb-2">
          {vi
            ? "Target là trạng thái đảo của case có thêm AUF ở cuối. Đừng nhìn công thức ở card; nhận diện U/U2/U' rồi nhập solution bạn nhớ."
            : "The target is the inverse case with an AUF appended. Do not look at the formula card; recognize U/U2/U' and enter the solution you recall."}
        </p>
        {target ? (
          <>
            <div className="rounded-card border border-line/80 bg-surface shadow-soft">
              <div className="p-5 sm:p-6 py-2">
                <span className="text-sm text-muted block mb-1">
                  {vi ? "Target scramble" : "Target scramble"}
                </span>
                <strong className="font-mono text-sm break-words">
                  {target.scramble}
                </strong>
                <small className="text-muted block mt-1">AUF: {auf}</small>
              </div>
            </div>
            <label
              htmlFor="bld-target-answer"
              className="mb-1.5 block text-sm font-medium text-ink mt-4"
            >
              {vi ? "Solution của bạn" : "Your solution"}
            </label>
            <Textarea
              className="font-mono"
              id="bld-target-answer"
              value={answer}
              onChange={event => {
                setAnswer(event.target.value);
                setResult("idle");
              }}

              rows={2}
              placeholder={
                vi ? "Nhập các nước bạn nhớ…" : "Enter the moves you recall…"
              }
            />
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={check}
                disabled={!answer.trim()}
              >
                {vi ? "Kiểm tra solution" : "Check solution"}
              </Button>
              <IconButton
                label={
                  vi ? "Đổi AUF target scramble" : "Change AUF target scramble"
                }
                icon={<Dices className="text-base" />}
                onClick={nextAuf}
                className={`${buttonClass("secondary", "md")}`}
              />
            </div>
          </>
        ) : (
          <div className="rounded-panel border px-4 py-3 text-sm border-warning/25 bg-warning-soft text-ink mt-4 mb-0">
            {vi
              ? "Biến thể này có ký hiệu chưa được cube engine hỗ trợ nên chưa thể tạo target tự kiểm. Bạn vẫn có thể xem và chọn công thức trong thư viện."
              : "This variant uses notation the cube engine does not support, so a self-check target cannot be created yet. You can still view and choose it in the library."}
          </div>
        )}
        {result === "pass" && (
          <div className="rounded-panel border px-4 py-3 text-sm border-success/20 bg-success-soft text-ink mt-4 mb-0">
            <Check className="text-base mr-1" />
            {vi
              ? "Đúng. Solution của bạn đưa target scramble có AUF về khối đã giải."
              : "Correct. Your solution returns the AUF target scramble to a solved cube."}
          </div>
        )}
        {result === "wrong" && (
          <div className="rounded-panel border px-4 py-3 text-sm border-warning/25 bg-warning-soft text-ink mt-4 mb-0">
            {vi
              ? "Chưa giải xong target. Kiểm tra lại công thức và phần AUF ở cuối scramble."
              : "The target is not solved yet. Check the algorithm and the AUF at the end of the scramble."}
          </div>
        )}
        {result === "invalid" && (
          <div className="rounded-panel border px-4 py-3 text-sm border-danger/20 bg-danger-soft text-ink mt-4 mb-0">
            {vi
              ? "Có ký hiệu nước chưa được hỗ trợ. Hãy dùng ký hiệu chuẩn như R, U', M hoặc l."
              : "An unsupported move notation was used. Try standard notation such as R, U', M, or l."}
          </div>
        )}
      </div>
    </section>
  );
}
