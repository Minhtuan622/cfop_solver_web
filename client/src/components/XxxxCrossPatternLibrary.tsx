/** Bootstrap sample shelf: verified cube examples that a beginner can load and try. */
import { useState } from "react";
import { Check, ClipboardCopy, ShieldCheck } from "@/components/ui/BootstrapIcon";

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
  return <section className="card mt-3" aria-label={vi ? "Mẫu để thử" : "Examples to try"}>
    <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2"><div><h2 className="h6 mb-0"><ShieldCheck className="fs-6 me-2" />{vi ? "Mẫu để thử" : "Examples to try"}</h2><small className="text-body-secondary">{vi ? "Chọn một mẫu để xem ứng dụng làm việc như thế nào." : "Load an example to see how the app works."}</small></div><span className="badge text-bg-success">{vi ? "Đã kiểm tra" : "Checked"}</span></div>
    <div className="list-group list-group-flush">{PATTERNS.map((pattern, index) => <article className="list-group-item" key={pattern.id}><div className="d-flex flex-wrap align-items-start justify-content-between gap-2"><div><h3 className="h6 mb-1">{vi ? `Mẫu ${index + 1}` : `Example ${index + 1}`}</h3><p className="small text-body-secondary mb-2">{vi ? `${pattern.moveCount} lượt xoay · Mẫu này đã được kiểm tra để đưa khối về trạng thái hoàn thành.` : `${pattern.moveCount} turns · This example has been checked to return the cube to a finished state.`}</p></div><div className="btn-group btn-group-sm"><button type="button" className="btn btn-outline-secondary" onClick={() => copy(pattern)} aria-label={vi ? `Sao chép mẫu ${index + 1}` : `Copy example ${index + 1}`}>{copied === pattern.id ? <Check className="fs-6" /> : <ClipboardCopy className="fs-6" />}</button><button type="button" className="btn btn-outline-primary" onClick={() => onUse(pattern.scramble)}>{vi ? "Dùng mẫu này" : "Use this example"}</button></div></div><dl className="row small mb-0"><dt className="col-sm-3 text-body-secondary">{vi ? "Tình trạng khối" : "Cube state"}</dt><dd className="col-sm-9"><code>{pattern.scramble}</code></dd><dt className="col-sm-3 text-body-secondary">{vi ? "Cách xoay để hoàn thành" : "Turns to finish"}</dt><dd className="col-sm-9"><code>{pattern.algorithm}</code></dd></dl></article>)}</div>
    <div className="card-body py-2"><small className="text-body-secondary">{vi ? "Bạn có thể dùng các mẫu này để làm quen trước khi nhập khối của mình." : "You can use these examples before entering your own cube."}</small></div>
  </section>;
}
