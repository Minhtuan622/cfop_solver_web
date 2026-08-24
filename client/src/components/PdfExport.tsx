/** Client-side PDF export, rendered from HTML so Vietnamese and English are preserved. */
import { Download, FileText } from "@/components/BootstrapIcon";
import type { SolverResult } from "@/lib/solverRuntime";
import { simplePhase, useLanguage } from "@/contexts/LanguageContext";

export function PdfExport({ result, input, inputKind }: { result: SolverResult | null; input: string; inputKind: "scramble" | "state" }) {
  const { language, t } = useLanguage();
  async function exportPdf() {
    if (!result) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const root = document.createElement("section");
    root.style.cssText = "width:760px;padding:36px;font-family:Arial,sans-serif;color:#17221d;background:#f4f0e8";
    const title = language === "vi" ? "Hướng dẫn giải Rubik" : "Rubik's Cube solution guide";
    const inputName = inputKind === "scramble" ? (language === "vi" ? "Chuỗi xoay ban đầu" : "Starting moves") : (language === "vi" ? "Màu 6 mặt" : "6-face colors");
    root.innerHTML = `<div style="background:#17221d;color:#f4f0e8;padding:22px;border-bottom:7px solid #1ba77a"><div style="font-size:11px;letter-spacing:2px;color:#1ba77a">CFOP SOLVER STUDIO</div><h1 style="margin:8px 0 0;font-size:27px">${title}</h1></div><p><b>${inputName}:</b> ${input}</p><p><b>${language === "vi" ? "Tổng số nước xoay" : "Total moves"}:</b> ${result.trace.length}</p><hr style="border:0;border-top:2px solid #17221d"/>${result.phases.map((phase) => `<section style="margin-top:18px;border-left:5px solid #1ba77a;padding-left:14px"><h2 style="margin:0;font-size:18px">${simplePhase(phase.name, language)}</h2><p><b>${language === "vi" ? "Các nước xoay" : "Moves"}:</b> ${phase.moves.join(" ") || (language === "vi" ? "Đã đúng" : "Already complete")}</p>${phase.case_id && phase.case_id !== "solved" ? `<p><b>Case:</b> ${phase.case_id}</p>` : ""}<p style="color:#376d58">${language === "vi" ? "Đã kiểm tra: Hoàn thành" : "Checked: Complete"}</p></section>`).join("")}<hr style="border:0;border-top:2px solid #17221d"/><p><b>${language === "vi" ? "Toàn bộ chuỗi xoay" : "Complete move list"}:</b> ${result.algorithm}</p>`;
    await doc.html(root, { autoPaging: "text", margin: [10, 10, 10, 10], width: 190, windowWidth: 820 });
    doc.save(`rubik-guide-${language}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }
  return <button type="button" disabled={!result} onClick={exportPdf} className="btn btn-outline-secondary w-100 d-inline-flex align-items-center justify-content-center gap-2"><FileText className="fs-6" />{result ? t("pdf.export") : t("pdf.wait")}<Download className="fs-6" /></button>;
}
