/* Bootstrap-first self-check: the target state is the inverse of the chosen starter algorithm. */
import type { StarterFormula } from "@/components/BldStudyLab";
import { Check, Redo2 } from "@/components/BootstrapIcon";
import { parseFastMoves, stateFromScramble, validateRecordedSolution } from "@/lib/fastCube";
import { useMemo, useState } from "react";

function inverseAlgorithm(algorithm: string) {
  return parseFastMoves(algorithm).reverse().map((move) => move.endsWith("2") ? move : move.endsWith("'") ? move.slice(0, -1) : `${move}'`).join(" ");
}

export function BldTargetSelfCheck({ formula, language }: { formula: StarterFormula; language: "vi" | "en" }) {
  const vi = language === "vi";
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<"idle" | "pass" | "wrong" | "invalid">("idle");
  const targetScramble = useMemo(() => inverseAlgorithm(formula.algorithm), [formula.algorithm]);
  const targetState = useMemo(() => stateFromScramble(targetScramble), [targetScramble]);
  const reset = () => { setAnswer(""); setResult("idle"); };
  const check = () => {
    const validation = validateRecordedSolution(targetState, answer);
    setResult(validation.valid && validation.moves.length ? "pass" : validation.error === "unsupported" ? "invalid" : "wrong");
  };
  return <section className="card bg-body-tertiary mb-4"><div className="card-body"><div className="d-flex flex-wrap align-items-center justify-content-between gap-2"><div><p className="small text-uppercase fw-semibold text-body-secondary mb-1">{vi ? "TỰ KIỂM" : "SELF-CHECK"}</p><h4 className="h6 mb-0">{vi ? "Giải target scramble bằng công thức vừa chọn" : "Solve the target scramble with the selected algorithm"}</h4></div><span className="badge text-bg-secondary">{formula.kind.toUpperCase()} · {formula.key}</span></div><p className="small text-body-secondary mt-3 mb-2">{vi ? "Target bên dưới là trạng thái đảo của case này. Đừng nhìn công thức ở card; nhập nước xoay bạn nhớ rồi kiểm tra." : "The target below is the inverse state of this case. Do not look at the formula card; enter the moves you recall, then check."}</p><div className="card bg-body"><div className="card-body py-2"><span className="small text-body-secondary d-block mb-1">{vi ? "Target scramble" : "Target scramble"}</span><strong className="font-monospace small text-break">{targetScramble}</strong></div></div><label htmlFor="bld-target-answer" className="form-label mt-3">{vi ? "Solution của bạn" : "Your solution"}</label><textarea id="bld-target-answer" value={answer} onChange={(event) => { setAnswer(event.target.value); setResult("idle"); }} className="form-control font-monospace" rows={2} placeholder={vi ? "Nhập nước xoay bạn nhớ…" : "Enter the moves you recall…"} /><div className="d-flex flex-wrap gap-2 mt-3"><button type="button" onClick={check} disabled={!answer.trim()} className="btn btn-primary">{vi ? "Kiểm tra solution" : "Check solution"}</button><button type="button" onClick={reset} aria-label={vi ? "Làm lại target scramble" : "Reset target scramble"} className="btn btn-outline-secondary"><Redo2 className="fs-6" /></button></div>{result === "pass" && <div className="alert alert-success mt-3 mb-0"><Check className="fs-6 me-1" />{vi ? "Đúng. Solution của bạn đưa target scramble về cube đã giải." : "Correct. Your solution returns the target scramble to a solved cube."}</div>}{result === "wrong" && <div className="alert alert-warning mt-3 mb-0">{vi ? "Chưa giải xong target. Xem lại nhịp công thức, rồi thử lại mà không nhìn card algorithm." : "The target is not solved yet. Review the formula rhythm, then try again without looking at the algorithm card."}</div>}{result === "invalid" && <div className="alert alert-danger mt-3 mb-0">{vi ? "Có ký hiệu nước xoay chưa được hỗ trợ. Hãy dùng notation chuẩn như R, U', M hoặc l." : "An unsupported move notation was used. Try standard notation such as R, U', M, or l."}</div>}</div></section>;
}
