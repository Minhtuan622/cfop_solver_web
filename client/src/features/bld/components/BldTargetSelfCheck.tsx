/* Bootstrap-first self-check: the target state is the inverse of the chosen starter algorithm. */
import type { StarterFormula } from "@/features/bld";
import { Check, Dices } from "@/components/ui/BootstrapIcon";
import { IconButton } from "@/components/ui/BootstrapUI";
import { parseFastMoves, stateFromScramble, validateRecordedSolution } from "@/lib/fastCube";
import { useEffect, useMemo, useState } from "react";

function inverseAlgorithm(algorithm: string) {
  return parseFastMoves(algorithm).reverse().map((move) => move.endsWith("2") ? move : move.endsWith("'") ? move.slice(0, -1) : `${move}'`).join(" ");
}

export function BldTargetSelfCheck({ formula, language }: { formula: StarterFormula; language: "vi" | "en" }) {
  const vi = language === "vi";
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<"idle" | "pass" | "wrong" | "invalid">("idle");
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
  useEffect(() => { setAnswer(""); setResult("idle"); }, [formula.algorithm]);
  const nextAuf = () => { setAufCursor((current) => current + 1); setAnswer(""); setResult("idle"); };
  const check = () => {
    if (!target) { setResult("invalid"); return; }
    const validation = validateRecordedSolution(target.state, answer);
    setResult(validation.valid && validation.moves.length ? "pass" : validation.error === "unsupported" ? "invalid" : "wrong");
  };
  return <section className="card bg-body-tertiary mb-4"><div className="card-body"><div className="d-flex flex-wrap align-items-center justify-content-between gap-2"><div><p className="small text-uppercase fw-semibold text-body-secondary mb-1">{vi ? "TỰ KIỂM · AUF" : "SELF-CHECK · AUF"}</p><h4 className="h6 mb-0">{vi ? "Giải target scramble bằng công thức vừa chọn" : "Solve the target scramble with the selected algorithm"}</h4></div><span className="badge text-bg-secondary">{formula.kind.toUpperCase()} · {formula.key}</span></div><p className="small text-body-secondary mt-3 mb-2">{vi ? "Target là trạng thái đảo của case có thêm AUF ở cuối. Đừng nhìn công thức ở card; nhận diện U/U2/U' rồi nhập solution bạn nhớ." : "The target is the inverse case with an AUF appended. Do not look at the formula card; recognize U/U2/U' and enter the solution you recall."}</p>{target ? <><div className="card bg-body"><div className="card-body py-2"><span className="small text-body-secondary d-block mb-1">{vi ? "Target scramble" : "Target scramble"}</span><strong className="font-monospace small text-break">{target.scramble}</strong><small className="text-body-secondary d-block mt-1">AUF: {auf}</small></div></div><label htmlFor="bld-target-answer" className="form-label mt-3">{vi ? "Solution của bạn" : "Your solution"}</label><textarea id="bld-target-answer" value={answer} onChange={(event) => { setAnswer(event.target.value); setResult("idle"); }} className="form-control font-monospace" rows={2} placeholder={vi ? "Nhập các nước bạn nhớ…" : "Enter the moves you recall…"} /><div className="d-flex flex-wrap gap-2 mt-3"><button type="button" onClick={check} disabled={!answer.trim()} className="btn btn-primary">{vi ? "Kiểm tra solution" : "Check solution"}</button><IconButton label={vi ? "Đổi AUF target scramble" : "Change AUF target scramble"} icon={<Dices className="fs-6" />} onClick={nextAuf} className="btn btn-outline-secondary" /></div></> : <div className="alert alert-warning mt-3 mb-0">{vi ? "Biến thể này có ký hiệu chưa được cube engine hỗ trợ nên chưa thể tạo target tự kiểm. Bạn vẫn có thể xem và chọn công thức trong thư viện." : "This variant uses notation the cube engine does not support, so a self-check target cannot be created yet. You can still view and choose it in the library."}</div>}{result === "pass" && <div className="alert alert-success mt-3 mb-0"><Check className="fs-6 me-1" />{vi ? "Đúng. Solution của bạn đưa target scramble có AUF về khối đã giải." : "Correct. Your solution returns the AUF target scramble to a solved cube."}</div>}{result === "wrong" && <div className="alert alert-warning mt-3 mb-0">{vi ? "Chưa giải xong target. Kiểm tra lại công thức và phần AUF ở cuối scramble." : "The target is not solved yet. Check the algorithm and the AUF at the end of the scramble."}</div>}{result === "invalid" && <div className="alert alert-danger mt-3 mb-0">{vi ? "Có ký hiệu nước chưa được hỗ trợ. Hãy dùng ký hiệu chuẩn như R, U', M hoặc l." : "An unsupported move notation was used. Try standard notation such as R, U', M, or l."}</div>}</div></section>;
}
