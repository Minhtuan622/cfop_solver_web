/** Bootstrap settings for cubers: CFOP defaults first, then timer and study preferences. */
import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw } from "@/components/ui/BootstrapIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { DEFAULT_SOLVER_SETTINGS, readSolverSettings, writeSolverSettings, type SolverSettings } from "@/lib/appSettings";
import { readLastLayerStudy, writeLastLayerStudy } from "@/features/last-layer";
import { readStoredValue, writeStoredValue } from "@/lib/browserStorage";

type F2LSlot = NonNullable<SolverSettings["preferredSlot"]>;

const colors: { value: SolverSettings["crossColor"]; hex: string; vi: string; en: string }[] = [
  { value: "U", hex: "#f7f3e9", vi: "Trắng", en: "White" }, { value: "D", hex: "#e7c34f", vi: "Vàng", en: "Yellow" },
  { value: "F", hex: "#1ba77a", vi: "Xanh lá", en: "Green" }, { value: "B", hex: "#3b6fc7", vi: "Xanh dương", en: "Blue" },
  { value: "R", hex: "#d95743", vi: "Đỏ", en: "Red" }, { value: "L", hex: "#ed8e42", vi: "Cam", en: "Orange" },
];
const slots: F2LSlot[] = ["FR", "FL", "BL", "BR"];

function Switch({ id, checked, onChange, label, help }: { id: string; checked: boolean; onChange: (next: boolean) => void; label: string; help?: string }) {
  return <div className="form-check form-switch"><input id={id} className="form-check-input" type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} /><label className="form-check-label" htmlFor={id}>{label}{help ? <small className="d-block text-body-secondary">{help}</small> : null}</label></div>;
}

export default function Settings() {
  const { language, setLanguage } = useLanguage();
  const vi = language === "vi";
  const text = (vietnamese: string, english: string) => vi ? vietnamese : english;
  const [solver, setSolver] = useState<SolverSettings>(readSolverSettings);
  const [sound, setSound] = useState(() => readStoredValue("cfop-inspection-sound") !== "off");
  const [splits, setSplits] = useState(() => readStoredValue("cfop-space-splits") !== "off");
  const [highlight, setHighlight] = useState(() => readStoredValue("cfop-cross-highlight") !== "off");
  const [dailyGoal, setDailyGoal] = useState(() => readLastLayerStudy().dailyGoal);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const firstSave = useRef(true);

  useEffect(() => {
    if (firstSave.current) { firstSave.current = false; return; }
    setSaveState("saving");
    const id = window.setTimeout(() => {
      writeSolverSettings(solver);
      writeStoredValue("cfop-inspection-color", solver.crossColor);
      writeStoredValue("cfop-inspection-sound", sound ? "on" : "off");
      writeStoredValue("cfop-space-splits", splits ? "on" : "off");
      writeStoredValue("cfop-cross-highlight", highlight ? "on" : "off");
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

  const updateSolver = (next: Partial<SolverSettings>) => setSolver((current) => ({ ...current, ...next }));
  const toggleExcluded = (slot: F2LSlot) => setSolver((current) => {
    const excludedSlots = current.excludedSlots.includes(slot) ? current.excludedSlots.filter((value) => value !== slot) : [...current.excludedSlots, slot];
    return { ...current, excludedSlots, preferredSlot: current.preferredSlot === slot ? undefined : current.preferredSlot };
  });
  const reset = () => { setSolver(DEFAULT_SOLVER_SETTINGS); setSound(true); setSplits(true); setHighlight(true); setDailyGoal(12); };

  const openingOptions: { value: SolverSettings["opening"]; label: string }[] = [
    { value: "cross", label: text("Cross chuẩn", "Standard Cross") }, { value: "auto", label: "XCross · Cross + 1 F2L" },
    { value: "xxcross", label: "XXCross · Cross + 2 F2L" }, { value: "xxxcross", label: "XXXCross · Cross + 3 F2L" }, { value: "xxxxcross", label: "XXXXCross · Full F2L" },
  ];
  const lastLayerOptions: { value: SolverSettings["lastLayer"]; label: string }[] = [
    { value: "auto", label: text("Tự động · ZBLL → 1LLL → OLL/PLL", "Auto · ZBLL → 1LLL → OLL/PLL") },
    { value: "oll_pll", label: "OLL + PLL" }, { value: "zbll", label: text("ZBLL · cần EO", "ZBLL · EO required") }, { value: "1lll", label: "1LLL" },
  ];

  return <main className="container py-3"><div className="row g-3"><section className="col-12 col-xl-8"><div className="card"><div className="card-body"><div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4"><div><h1 className="h4 mb-1">{text("Cài đặt", "Settings")}</h1><p className="text-body-secondary mb-0">{text("Thiết lập mặc định cho Solver, Timer và Study. Mọi thay đổi được tự động lưu.", "Set defaults for Solver, Timer, and Study. All changes save automatically.")}</p></div><span className="badge text-bg-secondary">CFOP</span></div><div className="accordion" id="cuber-settings">
    <section className="accordion-item"><h2 className="accordion-header"><button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#settings-cfop" aria-expanded="true" aria-controls="settings-cfop">CFOP Solver</button></h2><div id="settings-cfop" className="accordion-collapse collapse show"><div className="accordion-body"><div className="vstack gap-4">
      <div><label className="form-label">{text("Màu Cross", "Cross color")}</label><div className="d-flex flex-wrap gap-2" role="radiogroup" aria-label={text("Màu Cross", "Cross color")}>{colors.map((color) => <button key={color.value} type="button" role="radio" aria-checked={solver.crossColor === color.value} onClick={() => updateSolver({ crossColor: color.value })} className={solver.crossColor === color.value ? "btn btn-primary p-1" : "btn btn-outline-secondary p-1"} title={text(color.vi, color.en)} aria-label={text(color.vi, color.en)}><span className="d-block rounded" style={{ backgroundColor: color.hex, width: "1.5rem", height: "1.5rem" }} /></button>)}</div><p className="small text-body-secondary mb-0 mt-2">{text("Màu Cross luôn được đặt ở mặt D khi xem Cube 3D và chạy lời giải.", "The Cross color stays on the D face in Cube 3D and during solving.")}</p></div>
      <div><label className="form-label" htmlFor="setting-opening">Opening</label><select id="setting-opening" value={solver.opening} onChange={(event) => updateSolver({ opening: event.target.value as SolverSettings["opening"] })} className="form-select">{openingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><p className="small text-body-secondary mb-0 mt-2">{text("Chọn tier Opening muốn ưu tiên. Solver chỉ gắn nhãn XCross/XXCross/XXXCross/XXXXCross khi một chuỗi direct thực sự đạt Cross và đúng số F2L slot.", "Choose the Opening tier to prioritize. The solver labels XCross-family tiers only when one direct sequence truly reaches Cross and the required F2L slots.")}</p></div>
      {solver.opening !== "cross" ? <><div className="row g-3"><label className="col-12 col-md-6"><span className="form-label d-flex justify-content-between">{text("Độ sâu Direct Opening", "Direct Opening depth")}<strong>{solver.openingDepth}</strong></span><input aria-label={text("Độ sâu Direct Opening", "Direct Opening depth")} type="range" min="4" max="10" step="1" value={solver.openingDepth} onChange={(event) => updateSolver({ openingDepth: Number(event.target.value) })} className="form-range" /><small className="text-body-secondary">{text("Tăng depth khi muốn thử chuỗi opening dài hơn.", "Increase depth to try longer opening sequences.")}</small></label><label className="col-12 col-md-6"><span className="form-label d-flex justify-content-between">Node budget direct<strong>{solver.directNodeBudget.toLocaleString()}</strong></span><input aria-label="Node budget direct" type="range" min="500" max="50000" step="500" value={solver.directNodeBudget} onChange={(event) => updateSolver({ directNodeBudget: Number(event.target.value) })} className="form-range" /><small className="text-body-secondary">{text("Budget cao tìm kỹ hơn nhưng mất thời gian hơn; giữ hữu hạn để trình duyệt không bị treo.", "Higher budget searches harder but takes longer; it remains finite to protect the browser.")}</small></label></div><Switch id="setting-direct-only" checked={solver.openingFindResult} onChange={(openingFindResult) => updateSolver({ openingFindResult })} label={text("Ưu tiên direct đúng tier", "Prefer direct result at selected tier")} help={text("Không tính Cross rồi F2L tuần tự là XXCross, XXXCross hoặc XXXXCross.", "Never labels sequential Cross then F2L as XXCross, XXXCross, or XXXXCross.")} /><div><label className="form-label">{text("Ưu tiên F2L slot", "Preferred F2L slot")}</label><div className="btn-group w-100" role="group"><button type="button" onClick={() => updateSolver({ preferredSlot: undefined })} className={!solver.preferredSlot ? "btn btn-primary" : "btn btn-outline-secondary"}>{text("Tự động", "Auto")}</button>{slots.map((slot) => <button key={slot} type="button" disabled={solver.excludedSlots.includes(slot)} onClick={() => updateSolver({ preferredSlot: solver.preferredSlot === slot ? undefined : slot })} className={solver.preferredSlot === slot ? "btn btn-primary" : "btn btn-outline-secondary"}>{slot}</button>)}</div><label className="form-label mt-3">{text("Loại trừ F2L slot", "Exclude F2L slots")}</label><div className="btn-group w-100" role="group">{slots.map((slot) => <button key={`exclude-${slot}`} type="button" onClick={() => toggleExcluded(slot)} className={solver.excludedSlots.includes(slot) ? "btn btn-danger" : "btn btn-outline-secondary"}>{slot}</button>)}</div></div></> : null}
      <div><label className="form-label" htmlFor="setting-last-layer">Last Layer</label><select id="setting-last-layer" value={solver.lastLayer} onChange={(event) => updateSolver({ lastLayer: event.target.value as SolverSettings["lastLayer"] })} className="form-select">{lastLayerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><p className="small text-body-secondary mb-0 mt-2">{text("Auto thử ZBLL, 1LLL rồi mới dùng OLL + PLL; ZBLL chỉ chạy khi EO phù hợp.", "Auto tries ZBLL and 1LLL before OLL + PLL; ZBLL only runs when EO is compatible.")}</p></div>
    </div></div></div></section>
    <section className="accordion-item"><h2 className="accordion-header"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#settings-timer" aria-expanded="false" aria-controls="settings-timer">{text("Timer & Inspection", "Timer & Inspection")}</button></h2><div id="settings-timer" className="accordion-collapse collapse"><div className="accordion-body"><div className="vstack gap-3"><Switch id="setting-sound" checked={sound} onChange={setSound} label={text("Âm inspection 8s / 12s", "Inspection sound at 8s / 12s")} help={text("Phát cảnh báo trước mốc +2 (15 giây) và DNF (17 giây).", "Warns before the +2 (15 seconds) and DNF (17 seconds) limits.")} /><Switch id="setting-highlight" checked={highlight} onChange={setHighlight} label={text("Highlight Cross khi inspection", "Highlight Cross during inspection")} help={text("Làm rõ các mảnh thuộc màu Cross đã chọn trên Cube 3D.", "Emphasizes pieces matching the chosen Cross color on Cube 3D.")} /><Switch id="setting-splits" checked={splits} onChange={setSplits} label="Speed splits" help={text("Space / Enter / chạm Timer lần lượt đánh dấu Cross → F2L → OLL → PLL.", "Space / Enter / touch marks Cross → F2L → OLL → PLL in order.")} /></div></div></div></section>
    <section className="accordion-item"><h2 className="accordion-header"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#settings-study" aria-expanded="false" aria-controls="settings-study">{text("Study & ngôn ngữ", "Study & language")}</button></h2><div id="settings-study" className="accordion-collapse collapse"><div className="accordion-body"><div className="row g-3"><label className="col-12 col-sm-6"><span className="form-label">{text("Mục tiêu case mỗi ngày", "Daily case goal")}</span><input className="form-control" type="number" min="1" max="200" value={dailyGoal} onChange={(event) => setDailyGoal(Math.max(1, Math.min(200, Number(event.target.value) || 1)))} /><small className="text-body-secondary">{text("Áp dụng cho danh sách ôn Study/SRS.", "Applies to the Study/SRS review list.")}</small></label><div className="col-12 col-sm-6"><span className="form-label d-block">{text("Ngôn ngữ", "Language")}</span><div className="btn-group"><button type="button" onClick={() => setLanguage("vi")} className={vi ? "btn btn-primary" : "btn btn-outline-secondary"}>Tiếng Việt</button><button type="button" onClick={() => setLanguage("en")} className={!vi ? "btn btn-primary" : "btn btn-outline-secondary"}>English</button></div></div></div></div></div></section>
  </div></div><div className="card-footer d-flex flex-wrap justify-content-between align-items-center gap-2"><button type="button" onClick={reset} className="btn btn-outline-secondary btn-sm"><RotateCcw className="fs-6 me-1" />{text("Khôi phục mặc định", "Restore defaults")}</button><span className="small text-body-secondary" role="status" aria-live="polite">{saveState === "saving" ? text("Đang lưu…", "Saving…") : saveState === "saved" ? <><Check className="fs-6 me-1" />{text("Đã lưu", "Saved")}</> : text("Tự động lưu", "Saves automatically")}</span></div></div></section><aside className="col-12 col-xl-4"><div className="alert alert-info mb-0"><h2 className="h6">{text("Ghi chú về direct Opening", "Direct Opening note")}</h2><p className="mb-0">{text("XCross đến XXXXCross là một opening nguyên tử: Cross và các cặp F2L mục tiêu phải hoàn tất trong cùng một chuỗi. Nếu không có kết quả direct trong budget, Solver hiển thị fallback thực tế thay vì gắn nhãn tier cao sai.", "XCross through XXXXCross are atomic openings: Cross and target F2L pairs must finish in the same sequence. If no direct result fits the budget, the Solver shows the actual fallback instead of a false higher tier.")}</p></div></aside></div></main>;
}
