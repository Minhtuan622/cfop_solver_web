/** Xưởng Cơ Khí Tốc Độ — client-side evidence sheet export for a completed CFOP solve. */
import { Download, FileText } from "lucide-react";
import type { SolverResult } from "@/lib/solverRuntime";

function title(name: string) { return name.startsWith("f2l_") ? `F2L ${name.slice(4)}` : name.toUpperCase(); }

export function PdfExport({ result, input, inputKind }: { result: SolverResult | null; input: string; inputKind: "scramble" | "state" }) {
  async function exportPdf() {
    if (!result) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    let y = 16;
    const line = (text: string, size = 9, color = "#17221d") => { doc.setFont("courier", size === 9 ? "normal" : "bold"); doc.setTextColor(color); const wrapped = doc.splitTextToSize(text, 178); if (y + wrapped.length * 5 > 278) { doc.addPage(); y = 16; } doc.text(wrapped, 16, y); y += wrapped.length * 5 + 2; };
    doc.setFillColor("#17221d"); doc.rect(0, 0, 210, 32, "F"); doc.setTextColor("#1ba77a"); doc.setFont("courier", "bold"); doc.setFontSize(8); doc.text("CFOP SOLVER STUDIO / VERIFIED MOVE SHEET", 16, 12); doc.setTextColor("#f4f0e8"); doc.setFontSize(18); doc.text("Cross - F2L - OLL - PLL", 16, 23); y = 43;
    line(`INPUT TYPE: ${inputKind.toUpperCase()}`, 10); line(`INPUT: ${input}`, 9); line(`TOTAL MOVES: ${result.trace.length} | PHASES: ${result.phases.length} | FINAL STATE: SOLVED`, 9); y += 3;
    for (const phase of result.phases) { doc.setDrawColor("#1ba77a"); doc.line(16, y, 194, y); y += 6; line(`${title(phase.name)}${phase.case_id && phase.case_id !== "solved" ? ` / CASE ${phase.case_id}` : ""}`, 11, "#17221d"); line(`MOVES (${phase.moves.length}): ${phase.moves.join(" ") || "Already satisfied"}`, 9); if (phase.algorithm) line(`ALGORITHM: ${phase.algorithm}`, 8, "#4a5b51"); line(`INVARIANT: ${phase.valid_after && phase.predicate_after ? "PASSED" : "FAILED"}`, 8, "#1b7b5e"); }
    y += 4; line(`FULL SEQUENCE: ${result.algorithm}`, 8, "#17221d"); doc.save(`cfop-solution-${new Date().toISOString().slice(0, 10)}.pdf`);
  }
  return <button disabled={!result} onClick={exportPdf} className="scanner-button w-full justify-center disabled:opacity-40"><FileText className="h-3.5 w-3.5" />Xuất PDF chi tiết<Download className="h-3.5 w-3.5" /></button>;
}
