/** Bootstrap-only settings: plain-language defaults for people who only want to solve a cube. */
import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw } from "@/components/BootstrapIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { DEFAULT_SOLVER_SETTINGS, readSolverSettings, writeSolverSettings, type SolverSettings } from "@/lib/appSettings";
import { readLastLayerStudy, writeLastLayerStudy } from "@/lib/lastLayerStudy";

const colors: { value: SolverSettings["crossColor"]; hex: string; vi: string; en: string }[] = [
  { value: "U", hex: "#f7f3e9", vi: "Trắng", en: "White" }, { value: "D", hex: "#e7c34f", vi: "Vàng", en: "Yellow" },
  { value: "F", hex: "#1ba77a", vi: "Xanh lá", en: "Green" }, { value: "B", hex: "#3b6fc7", vi: "Xanh dương", en: "Blue" },
  { value: "R", hex: "#d95743", vi: "Đỏ", en: "Red" }, { value: "L", hex: "#ed8e42", vi: "Cam", en: "Orange" },
];

export default function Settings() {
  const { language, setLanguage } = useLanguage();
  const vi = language === "vi";
  const text = (vietnamese: string, english: string) => vi ? vietnamese : english;
  const [solver, setSolver] = useState<SolverSettings>(readSolverSettings);
  const [sound, setSound] = useState(() => localStorage.getItem("cfop-inspection-sound") !== "off");
  const [splits, setSplits] = useState(() => localStorage.getItem("cfop-space-splits") !== "off");
  const [highlight, setHighlight] = useState(() => localStorage.getItem("cfop-cross-highlight") !== "off");
  const [dailyGoal, setDailyGoal] = useState(() => readLastLayerStudy().dailyGoal);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const firstSave = useRef(true);

  useEffect(() => {
    if (firstSave.current) { firstSave.current = false; return; }
    setSaveState("saving");
    const id = window.setTimeout(() => {
      writeSolverSettings(solver);
      localStorage.setItem("cfop-inspection-color", solver.crossColor);
      localStorage.setItem("cfop-inspection-sound", sound ? "on" : "off");
      localStorage.setItem("cfop-space-splits", splits ? "on" : "off");
      localStorage.setItem("cfop-cross-highlight", highlight ? "on" : "off");
      writeLastLayerStudy({ ...readLastLayerStudy(), dailyGoal });
      setSaveState("saved");
    }, 350);
    return () => window.clearTimeout(id);
  }, [solver, sound, splits, highlight, dailyGoal, language]);

  useEffect(() => {
    if (saveState !== "saved") return;
    const id = window.setTimeout(() => setSaveState("idle"), 1800);
    return () => window.clearTimeout(id);
  }, [saveState]);

  const reset = () => { setSolver(DEFAULT_SOLVER_SETTINGS); setSound(true); setSplits(true); setHighlight(true); setDailyGoal(12); };

  return <div className="container py-3"><div className="row g-3"><section className="col-12 col-lg-7"><div className="card"><div className="card-body"><h1 className="h4 mb-1">{text("Cài đặt", "Settings")}</h1><p className="text-body-secondary mb-4">{text("Bạn không cần thay đổi gì để bắt đầu. Các lựa chọn này chỉ giúp ứng dụng hợp với cách bạn muốn dùng.", "You do not need to change anything to get started. These options only adapt the app to you.")}</p><div className="vstack gap-4"><section><h2 className="h6">{text("Khối Rubik", "Your cube")}</h2><label className="form-label">{text("Màu ở mặt đáy khi xem hướng dẫn", "Bottom-side color while viewing steps")}</label><div className="d-flex flex-wrap gap-2">{colors.map((color) => <button key={color.value} type="button" onClick={() => setSolver((current) => ({ ...current, crossColor: color.value }))} className={solver.crossColor === color.value ? "btn btn-primary p-1" : "btn btn-outline-secondary p-1"} title={text(color.vi, color.en)} aria-label={text(color.vi, color.en)}><span className="d-block rounded" style={{ backgroundColor: color.hex, width: "1.5rem", height: "1.5rem" }} /></button>)}</div></section><section><h2 className="h6">{text("Cách ứng dụng tìm lời giải", "How the app finds a solution")}</h2><label className="form-label" htmlFor="setting-search-style">{text("Mức tìm kiếm", "Search effort")}</label><select id="setting-search-style" value={solver.opening} onChange={(event) => setSolver((current) => ({ ...current, opening: event.target.value as SolverSettings["opening"] }))} className="form-select"><option value="cross">{text("Cách cơ bản", "Standard method")}</option><option value="auto">{text("Tìm bước đầu ngắn hơn", "Look for a shorter start")}</option><option value="xxcross">{text("Tìm kỹ hơn", "Search more")}</option><option value="xxxcross">{text("Tìm rất kỹ", "Search deeply")}</option><option value="xxxxcross">{text("Tìm tối đa", "Search most")}</option></select><p className="small text-body-secondary mt-2 mb-0">{text("Mức cao hơn có thể chờ lâu hơn. Nếu không tìm được cách phù hợp, ứng dụng tự chọn cách cơ bản.", "A higher level can take longer. If it does not find a fit, the app automatically uses the standard method.")}</p><div className="form-check form-switch mt-3"><input id="setting-try-shorter" type="checkbox" role="switch" checked={solver.openingFindResult} onChange={(event) => setSolver((current) => ({ ...current, openingFindResult: event.target.checked }))} className="form-check-input" /><label className="form-check-label" htmlFor="setting-try-shorter">{text("Ưu tiên cách bắt đầu ngắn hơn", "Prefer a shorter start")}</label></div><label className="form-label mt-3 d-flex justify-content-between" htmlFor="setting-search-effort"><span>{text("Tìm nhanh hay kỹ", "Search quickly or thoroughly")}</span><span>{solver.directNodeBudget <= 5000 ? text("Nhanh", "Quick") : solver.directNodeBudget < 20000 ? text("Cân bằng", "Balanced") : text("Kỹ", "Thorough")}</span></label><input id="setting-search-effort" aria-label={text("Tìm nhanh hay kỹ", "Search quickly or thoroughly")} type="range" min="500" max="50000" step="500" value={solver.directNodeBudget} onChange={(event) => setSolver((current) => ({ ...current, directNodeBudget: Number(event.target.value) }))} className="form-range" /><label className="form-label mt-3" htmlFor="setting-finish-style">{text("Cách hoàn thành", "How to finish")}</label><select id="setting-finish-style" value={solver.lastLayer} onChange={(event) => setSolver((current) => ({ ...current, lastLayer: event.target.value as SolverSettings["lastLayer"] }))} className="form-select"><option value="auto">{text("Tự chọn cách phù hợp", "Choose automatically")}</option><option value="oll_pll">{text("Hoàn thành theo hai chặng", "Finish in two stages")}</option><option value="zbll">{text("Ưu tiên cách ngắn", "Prefer a short finish")}</option><option value="1lll">{text("Thử hoàn thành ngay", "Try a direct finish")}</option></select></section><section><h2 className="h6">{text("Bấm giờ", "Timer")}</h2><div className="vstack gap-2"><div className="form-check form-switch"><input id="setting-sound" className="form-check-input" type="checkbox" checked={sound} onChange={() => setSound((value) => !value)} /><label className="form-check-label" htmlFor="setting-sound">{text("Âm báo trước khi bắt đầu", "Sound before starting")}</label></div><div className="form-check form-switch"><input id="setting-splits" className="form-check-input" type="checkbox" checked={splits} onChange={() => setSplits((value) => !value)} /><label className="form-check-label" htmlFor="setting-splits">{text("Ghi thời gian theo từng chặng", "Record time by stage")}</label></div><div className="form-check form-switch"><input id="setting-highlight" className="form-check-input" type="checkbox" checked={highlight} onChange={() => setHighlight((value) => !value)} /><label className="form-check-label" htmlFor="setting-highlight">{text("Làm rõ phần đang xem trên khối", "Highlight the part being viewed")}</label></div></div></section><section><h2 className="h6">{text("Ngôn ngữ và mục tiêu học", "Language and learning goal")}</h2><div className="row g-2"><label className="col-12 col-sm-6"><span className="form-label">{text("Số bài muốn xem mỗi ngày", "Items to review each day")}</span><input className="form-control" type="number" min="1" max="200" value={dailyGoal} onChange={(event) => setDailyGoal(Math.max(1, Math.min(200, Number(event.target.value) || 1)))} /></label><div className="col-12 col-sm-6"><span className="form-label d-block">{text("Ngôn ngữ", "Language")}</span><div className="btn-group"><button type="button" onClick={() => setLanguage("vi")} className={vi ? "btn btn-primary" : "btn btn-outline-secondary"}>Tiếng Việt</button><button type="button" onClick={() => setLanguage("en")} className={!vi ? "btn btn-primary" : "btn btn-outline-secondary"}>English</button></div></div></div></section></div></div><div className="card-footer d-flex flex-wrap justify-content-between align-items-center gap-2"><button type="button" onClick={reset} className="btn btn-outline-secondary btn-sm"><RotateCcw className="fs-6 me-1" />{text("Đặt lại", "Reset")}</button><span className="small text-body-secondary" role="status" aria-live="polite">{saveState === "saving" ? text("Đang lưu…", "Saving…") : saveState === "saved" ? <><Check className="fs-6 me-1" />{text("Đã lưu", "Saved")}</> : text("Tự động lưu", "Saves automatically")}</span></div></div></section><aside className="col-12 col-lg-5"><div className="alert alert-info mb-0"><h2 className="h6">{text("Gợi ý", "Tip")}</h2><p className="mb-0">{text("Nếu bạn mới bắt đầu, hãy giữ nguyên mọi lựa chọn. Khi cần, bạn luôn có thể quay lại đây và thử một cách tìm khác.", "If you are new, leave everything as it is. You can always return here and try another search style later.")}</p></div></aside></div></div>;
}
