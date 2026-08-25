/** Bootstrap reference shelf: only internally proven direct XXXXCross fixtures are listed. */
import { useState } from "react";
import { Check, ClipboardCopy, ShieldCheck } from "@/components/BootstrapIcon";

type Pattern = { id: string; name: string; scramble: string; algorithm: string; moveCount: number };

const PATTERNS: Pattern[] = [
  { id: "seed-sune", name: "Seed · four-turn inverse", scramble: "U R U' R'", algorithm: "R U R' U'", moveCount: 4 },
  { id: "seed-sexy-f", name: "Seed · F-framed trigger", scramble: "F U R U' R' F'", algorithm: "F R U R' U' F'", moveCount: 6 },
  { id: "seed-four-face", name: "Seed · four-face inverse", scramble: "L' F' U' R'", algorithm: "R U F L", moveCount: 4 },
];

export function XxxxCrossPatternLibrary({ language, onUse }: { language: "vi" | "en"; onUse: (scramble: string) => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const vi = language === "vi";
  const copy = async (pattern: Pattern) => {
    try { await navigator.clipboard.writeText(`${pattern.scramble}\n${pattern.algorithm}`); setCopied(pattern.id); window.setTimeout(() => setCopied(null), 1400); } catch { setCopied(null); }
  };
  return <section className="card mt-3" aria-label={vi ? "Thư viện pattern XXXXCross đã xác minh" : "Verified XXXXCross pattern library"}>
    <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2"><div><h2 className="h6 mb-0"><ShieldCheck className="fs-6 me-2" />{vi ? "Thư viện XXXXCross · direct proof" : "XXXXCross library · direct proof"}</h2><small className="text-body-secondary">{vi ? "Pattern tham chiếu, không phải claim từ Cross + F2L tuần tự." : "Reference patterns, never claims derived from sequential Cross + F2L."}</small></div><span className="badge text-bg-success">FR + FL + BL + BR</span></div>
    <div className="list-group list-group-flush">{PATTERNS.map((pattern) => <article className="list-group-item" key={pattern.id}><div className="d-flex flex-wrap align-items-start justify-content-between gap-2"><div><h3 className="h6 mb-1">{pattern.name}</h3><p className="small text-body-secondary mb-2">{vi ? `${pattern.moveCount} nước · proof: scramble + algorithm trở về cube solved, nên Cross và bốn slot F2L cùng đúng sau một chuỗi.` : `${pattern.moveCount} moves · proof: scramble + algorithm returns a solved cube, so Cross and four F2L slots hold after one sequence.`}</p></div><div className="btn-group btn-group-sm"><button type="button" className="btn btn-outline-secondary" onClick={() => copy(pattern)} aria-label={vi ? `Sao chép ${pattern.name}` : `Copy ${pattern.name}`}>{copied === pattern.id ? <Check className="fs-6" /> : <ClipboardCopy className="fs-6" />}</button><button type="button" className="btn btn-outline-primary" onClick={() => onUse(pattern.scramble)}>{vi ? "Nạp scramble" : "Load scramble"}</button></div></div><dl className="row small mb-0"><dt className="col-sm-3 text-body-secondary">Scramble</dt><dd className="col-sm-9"><code>{pattern.scramble}</code></dd><dt className="col-sm-3 text-body-secondary">{vi ? "Direct algorithm" : "Direct algorithm"}</dt><dd className="col-sm-9"><code>{pattern.algorithm}</code></dd></dl></article>)}</div>
    <div className="card-body py-2"><small className="text-body-secondary">{vi ? <>Các fixture này được regression bằng predicate <code>XXXXCross</code> và direct solver ở node budget 5.000. Tham khảo nghiên cứu coordinate: <a href="https://github.com/or18/RubiksSolver" target="_blank" rel="noreferrer">or18/RubiksSolver</a>.</> : <>These fixtures are regression-tested with the <code>XXXXCross</code> predicate and direct solver at a 5,000-node budget. Coordinate research: <a href="https://github.com/or18/RubiksSolver" target="_blank" rel="noreferrer">or18/RubiksSolver</a>.</>}</small></div>
  </section>;
}
