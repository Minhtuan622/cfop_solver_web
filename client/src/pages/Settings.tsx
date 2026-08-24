/* Xưởng Cơ Khí Tốc Độ — Display keeps navigation calibrated while semantic formula/memo surfaces have an independent readable scale. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, CircleHelp, Moon, RotateCcw, Sun } from "@/components/BootstrapIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { DEFAULT_SOLVER_SETTINGS, readSolverSettings, writeSolverSettings, type SolverSettings } from "@/lib/appSettings";
import { readLastLayerStudy, writeLastLayerStudy } from "@/lib/lastLayerStudy";

/** Bootstrap-minimal settings: one focused column, concise groups, and no decorative page header. */

const colors: { value: SolverSettings["crossColor"]; hex: string; vi: string; en: string }[] = [
  { value: "U", hex: "#f7f3e9", vi: "Trắng", en: "White" },
  { value: "D", hex: "#e7c34f", vi: "Vàng", en: "Yellow" },
  { value: "F", hex: "#1ba77a", vi: "Xanh lá", en: "Green" },
  { value: "B", hex: "#3b6fc7", vi: "Xanh dương", en: "Blue" },
  { value: "R", hex: "#d95743", vi: "Đỏ", en: "Red" },
  { value: "L", hex: "#ed8e42", vi: "Cam", en: "Orange" },
];
const openings: { value: SolverSettings["opening"]; label: string }[] = [
  { value: "cross", label: "Cross" }, { value: "auto", label: "XCross" }, { value: "xxcross", label: "XXCross" }, { value: "xxxcross", label: "XXXCross" }, { value: "xxxxcross", label: "XXXXCross" },
];
const lastLayers: { value: SolverSettings["lastLayer"]; label: string }[] = [
  { value: "auto", label: "Auto" }, { value: "oll_pll", label: "OLL + PLL" }, { value: "zbll", label: "ZBLL" }, { value: "1lll", label: "1LLL" },
];
const f2lSlots = ["FR", "FL", "BL", "BR"] as const;
const defaultTargets = { Cross: 4, F2L: 12, OLL: 4, PLL: 5 };
type Phase = keyof typeof defaultTargets;

function readTargets() {
  try {
    const raw = JSON.parse(localStorage.getItem("cfop-phase-targets") ?? "{}") as Partial<Record<Phase, number>>;
    return { Cross: raw.Cross ?? 4, F2L: raw.F2L ?? 12, OLL: raw.OLL ?? 4, PLL: raw.PLL ?? 5 };
  } catch { return defaultTargets; }
}

function Help({ text }: { text: string }) { return <span className="ms-1 text-muted" title={text} aria-label={text}><CircleHelp className="fs-6" /></span>; }
function SettingCard({ id, index, title, tip, children, open, onToggle }: { id: string; index: string; title: string; tip: string; children: ReactNode; open: boolean; onToggle: () => void }) {
  return <section className="accordion-item"><h2 className="accordion-header" id={`${id}-heading`}><button type="button" className={open ? "accordion-button" : "accordion-button collapsed"} onClick={onToggle} aria-expanded={open} aria-controls={id}><span><span className="small text-uppercase fw-semibold text-body-secondary d-block mb-1">{index}</span><span className="fw-semibold">{title}</span></span><Help text={tip} /></button></h2><div id={id} className={open ? "accordion-collapse collapse show" : "accordion-collapse collapse"} aria-labelledby={`${id}-heading`}><div className="accordion-body">{children}</div></div></section>;
}

export default function Settings() {
  const { language, setLanguage } = useLanguage();
  const { theme, themeMode, setThemeMode } = useTheme();
  const vi = language === "vi";
  const label = (viText: string, enText: string) => vi ? viText : enText;
  const [solver, setSolver] = useState<SolverSettings>(readSolverSettings);
  const [sound, setSound] = useState(() => localStorage.getItem("cfop-inspection-sound") !== "off");
  const [splits, setSplits] = useState(() => localStorage.getItem("cfop-space-splits") !== "off");
  const [highlight, setHighlight] = useState(() => localStorage.getItem("cfop-cross-highlight") !== "off");
  const [targets, setTargets] = useState(readTargets);
  const [dailyGoal, setDailyGoal] = useState(() => readLastLayerStudy().dailyGoal);
  const compactViewport = () => window.matchMedia("(max-width: 767.98px)").matches;
  const [isMobile, setIsMobile] = useState(compactViewport);
  const [openSections, setOpenSections] = useState<string[]>(() => compactViewport() ? [] : ["solver", "timer"]);
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const isFirstSavePass = useRef(true);

  const toggleSection = (section: string) => setOpenSections((current) => current.includes(section) ? current.filter((value) => value !== section) : [...current, section]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767.98px)");
    const syncViewport = () => {
      setIsMobile(query.matches);
      setOpenSections(query.matches ? [] : ["solver", "timer"]);
    };
    syncViewport();
    query.addEventListener("change", syncViewport);
    return () => query.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    if (isFirstSavePass.current) {
      isFirstSavePass.current = false;
      return;
    }
    setAutoSaveState("saving");
    const saveTimer = window.setTimeout(() => {
      writeSolverSettings(solver);
      localStorage.setItem("cfop-inspection-color", solver.crossColor);
      localStorage.setItem("cfop-inspection-sound", sound ? "on" : "off");
      localStorage.setItem("cfop-space-splits", splits ? "on" : "off");
      localStorage.setItem("cfop-cross-highlight", highlight ? "on" : "off");
      localStorage.setItem("cfop-phase-targets", JSON.stringify(targets));
      writeLastLayerStudy({ ...readLastLayerStudy(), dailyGoal });
      setAutoSaveState("saved");
    }, 350);
    return () => window.clearTimeout(saveTimer);
  }, [solver, sound, splits, highlight, targets, dailyGoal, language, themeMode]);

  useEffect(() => {
    if (autoSaveState !== "saved") return;
    const feedbackTimer = window.setTimeout(() => setAutoSaveState("idle"), 1800);
    return () => window.clearTimeout(feedbackTimer);
  }, [autoSaveState]);
  const reset = () => {
    setSolver(DEFAULT_SOLVER_SETTINGS);
    setSound(true);
    setSplits(true);
    setHighlight(true);
    setTargets(defaultTargets);
    setDailyGoal(12);
    setThemeMode("light");
  };
  const setTarget = (phase: Phase, value: number) => {
    if (Number.isFinite(value) && value > 0) setTargets((current) => ({ ...current, [phase]: value }));
  };

  return <div className="container py-3">
      <div className="accordion" id="settings-accordion">
        <SettingCard id="solver" open={openSections.includes("solver")} onToggle={() => toggleSection("solver")} index="01 · SOLVER" title={label("Thuật toán & Cross", "Solver & Cross")} tip={label("Chọn hướng Cross, độ sâu mở đầu và chiến lược lớp cuối mặc định cho lần giải mới.", "Sets the default Cross orientation, opening depth, and last-layer strategy for new solves.")}>
          <label className="form-label">{label("Màu Cross mặc định", "Default Cross color")}</label>
          <div className="d-flex flex-wrap gap-2">{colors.map((color) => <button key={color.value} onClick={() => setSolver((current) => ({ ...current, crossColor: color.value }))} className={solver.crossColor === color.value ? "btn btn-primary p-1" : "btn btn-outline-secondary p-1"} title={label(color.vi, color.en)}><span className="d-block rounded" style={{ backgroundColor: color.hex, width: "1.5rem", height: "1.5rem" }} /></button>)}</div>
          <label className="form-label mt-3">{label("Mở đầu", "Opening")}</label>
          <div className="d-flex flex-wrap gap-2">{openings.map((option) => <button key={option.value} onClick={() => setSolver((current) => ({ ...current, opening: option.value }))} className={solver.opening === option.value ? "btn btn-primary btn-sm" : "btn btn-outline-secondary btn-sm"}>{option.label}</button>)}</div>
          <label className="form-label mt-3 d-flex align-items-center justify-content-between"><span>{label("Độ sâu direct opening", "Direct opening depth")}</span><b>{solver.openingDepth}</b></label>
          <input aria-label={label("Độ sâu direct opening", "Direct opening depth")} type="range" min="4" max="10" step="1" value={solver.openingDepth} onChange={(event) => setSolver((current) => ({ ...current, openingDepth: Number(event.target.value) }))} className="form-range" />
          <p className="small text-muted">{label("Áp dụng đồng thời cho XCross đến XXXXCross. Depth cao hơn tìm kỹ hơn nhưng chậm hơn.", "Applies to XCross through XXXXCross. Higher depth searches harder but takes longer.")}</p>
          <label className="form-label">{label("Lớp cuối", "Last layer")}</label>
          <div className="d-flex flex-wrap gap-2">{lastLayers.map((option) => <button key={option.value} onClick={() => setSolver((current) => ({ ...current, lastLayer: option.value }))} className={solver.lastLayer === option.value ? "btn btn-primary btn-sm" : "btn btn-outline-secondary btn-sm"}>{option.label}</button>)}</div>
          <label className="form-label mt-3">{label("Ưu tiên / loại trừ F2L", "Prefer / exclude F2L")}</label>
          <div className="d-flex flex-wrap gap-2"><button onClick={() => setSolver((current) => ({ ...current, preferredSlot: undefined }))} className={!solver.preferredSlot ? "btn btn-primary btn-sm" : "btn btn-outline-secondary btn-sm"}>{label("Tự do", "Any")}</button>{f2lSlots.map((slot) => <button key={slot} disabled={solver.excludedSlots.includes(slot)} onClick={() => setSolver((current) => ({ ...current, preferredSlot: current.preferredSlot === slot ? undefined : slot }))} className={solver.preferredSlot === slot ? "btn btn-primary btn-sm" : "btn btn-outline-secondary btn-sm"}>{slot}</button>)}</div>
          <div className="d-flex flex-wrap gap-2 mt-2">{f2lSlots.map((slot) => <button key={slot} onClick={() => setSolver((current) => ({ ...current, preferredSlot: current.preferredSlot === slot ? undefined : current.preferredSlot, excludedSlots: current.excludedSlots.includes(slot) ? current.excludedSlots.filter((value) => value !== slot) : [...current.excludedSlots, slot] }))} className={solver.excludedSlots.includes(slot) ? "btn btn-danger btn-sm" : "btn btn-outline-secondary btn-sm"}>{label("Loại", "Skip")} {slot}</button>)}</div>
        </SettingCard>

        <SettingCard id="timer" open={openSections.includes("timer")} onToggle={() => toggleSection("timer")} index="02 · TIMER" title={label("Inspection & thao tác", "Inspection & input")} tip={label("Bật âm báo inspection, kiểm soát Speed split và lựa chọn highlight Cross trong preview 3D.", "Controls inspection audio, Speed split, and Cross highlight in the 3D preview.")}>
          <div className="vstack gap-2"><div className="form-check form-switch"><input id="setting-sound" className="form-check-input" type="checkbox" checked={sound} onChange={() => setSound(!sound)} /><label className="form-check-label" htmlFor="setting-sound">{label("Âm inspection", "Inspection sound")}</label></div><div className="form-check form-switch"><input id="setting-splits" className="form-check-input" type="checkbox" checked={splits} onChange={() => setSplits(!splits)} /><label className="form-check-label" htmlFor="setting-splits">Speed split</label></div><div className="form-check form-switch"><input id="setting-highlight" className="form-check-input" type="checkbox" checked={highlight} onChange={() => setHighlight(!highlight)} /><label className="form-check-label" htmlFor="setting-highlight">{label("Highlight Cross", "Cross highlight")}</label></div></div>
        </SettingCard>

        {splits && <SettingCard id="splits" open={openSections.includes("splits")} onToggle={() => toggleSection("splits")} index="03 · SPEED SPLIT" title={label("Mục tiêu pha", "Phase targets")} tip={label("Các ngưỡng này chỉ dùng khi Speed split bật để báo pha Cross, F2L, OLL và PLL chậm hơn mục tiêu.", "These limits appear only with Speed split and flag Cross, F2L, OLL, or PLL phases that exceed the target.")}><div className="row g-2 mt-1">{(Object.keys(targets) as Phase[]).map((phase) => <label key={phase} className="col-6 input-group"><span className="input-group-text">{phase}</span><input className="form-control" type="number" min="0.1" max="120" step="0.1" value={targets[phase]} onChange={(event) => setTarget(phase, Number(event.target.value))} /><span className="input-group-text">s</span></label>)}</div></SettingCard>}

        <SettingCard id="study" open={openSections.includes("study")} onToggle={() => toggleSection("study")} index="04 · STUDY" title={label("Mục tiêu & ngôn ngữ", "Goal & language")} tip={label("Đặt số case ôn mỗi ngày cho Study Bay và thay đổi ngôn ngữ toàn ứng dụng ngay lập tức.", "Sets the daily Study Bay review count and changes the application language immediately.")}>
          <label className="input-group mt-3"><span className="input-group-text">{label("Case / ngày", "Cases / day")}</span><input className="form-control" type="number" min="1" max="200" value={dailyGoal} onChange={(event) => setDailyGoal(Math.max(1, Math.min(200, Number(event.target.value) || 1)))} /><span className="input-group-text">{label("case", "cases")}</span></label>
          <div className="btn-group mt-4"><button onClick={() => setLanguage("vi")} className={vi ? "btn btn-primary" : "btn btn-outline-secondary"}>Tiếng Việt</button><button onClick={() => setLanguage("en")} className={!vi ? "btn btn-primary" : "btn btn-outline-secondary"}>English</button></div>
        </SettingCard>

        <SettingCard id="display" open={openSections.includes("display")} onToggle={() => toggleSection("display")} index="05 · DISPLAY" title={label("Giao diện", "Appearance")} tip={label("Chỉ giữ tùy chọn Sáng, Tối hoặc theo hệ điều hành. Màu nhấn và cỡ chữ được thống nhất để giao diện luôn dễ đọc.", "Keep Light, Dark, or System appearance. Accent and text scale are fixed for a consistent readable interface.")}>
          <label className="form-label mt-3">{label("Chế độ màu", "Color mode")}</label>
          <div className="btn-group"><button onClick={() => setThemeMode("light")} aria-label={label("Sáng", "Light")} className={themeMode === "light" ? "btn btn-primary" : "btn btn-outline-secondary"}><Sun className="fs-6" /></button><button onClick={() => setThemeMode("dark")} aria-label="Dark" className={themeMode === "dark" ? "btn btn-primary" : "btn btn-outline-secondary"}><Moon className="fs-6" /></button><button onClick={() => setThemeMode("system")} className={themeMode === "system" ? "btn btn-primary" : "btn btn-outline-secondary"}>{label("Hệ điều hành", "System")}</button></div>
          <p className="small text-muted mt-2">{themeMode === "system" ? (theme === "dark" ? label("Hệ điều hành hiện đang dùng Dark.", "System is currently using Dark.") : label("Hệ điều hành hiện đang dùng Sáng.", "System is currently using Light.")) : label("Lựa chọn này ghi đè giao diện hệ điều hành.", "This choice overrides the system appearance.")}</p>

          <p className="mt-4 text-body-secondary">{label("Chỉ lưu các thông số cần dùng. Lựa chọn hiển thị được áp dụng nhất quán trên toàn bộ công cụ.", "Only essential display settings are stored. Your appearance choice is applied consistently across the workspace.")}</p>
        </SettingCard>
      </div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2"><button type="button" onClick={reset} aria-label={label("Khôi phục cài đặt", "Reset settings")} className="btn btn-outline-secondary"><RotateCcw className="fs-6" /></button><span className="small text-body-secondary d-inline-flex align-items-center gap-1" role="status" aria-live="polite">{autoSaveState === "saving" ? <><span className="spinner-border spinner-border-sm" aria-hidden="true" />{label("Đang tự lưu", "Saving automatically")}</> : autoSaveState === "saved" ? <><Check className="fs-6" />{label("Đã tự lưu", "Saved automatically")}</> : label("Tự động lưu", "Auto-save enabled")}</span></div>
  </div>;
}
