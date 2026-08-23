/* Xưởng Cơ Khí Tốc Độ — Display keeps navigation calibrated while semantic formula/memo surfaces have an independent readable scale. */
import { useState, type ReactNode } from "react";
import { Check, CircleHelp, Moon, RotateCcw, Sun } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { DEFAULT_SOLVER_SETTINGS, readSolverSettings, writeSolverSettings, type SolverSettings } from "@/lib/appSettings";
import { readLastLayerStudy, writeLastLayerStudy } from "@/lib/lastLayerStudy";

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

function Help({ text }: { text: string }) { return <span className="settings-help" title={text} aria-label={text}><CircleHelp /></span>; }
function SettingCard({ index, title, tip, children }: { index: string; title: string; tip: string; children: ReactNode }) {
  return <section className="settings-sheet"><div className="settings-card-title"><p>{index}</p><h2>{title}<Help text={tip} /></h2></div>{children}</section>;
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
  const [saved, setSaved] = useState(false);

  const save = () => {
    writeSolverSettings(solver);
    localStorage.setItem("cfop-inspection-color", solver.crossColor);
    localStorage.setItem("cfop-inspection-sound", sound ? "on" : "off");
    localStorage.setItem("cfop-space-splits", splits ? "on" : "off");
    localStorage.setItem("cfop-cross-highlight", highlight ? "on" : "off");
    localStorage.setItem("cfop-phase-targets", JSON.stringify(targets));
    writeLastLayerStudy({ ...readLastLayerStudy(), dailyGoal });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };
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

  return <main className="settings-page min-h-screen bg-[#f4f0e8] text-[#17221d]">
    <div className="settings-workbench mx-auto max-w-5xl px-4 py-4 sm:px-6">
      <div className="settings-strip"><span>{label("CÀI ĐẶT ỨNG DỤNG", "APP SETTINGS")}</span><small>{label("Dấu ? giải thích từng nhóm", "? explains each group")}</small></div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <SettingCard index="01 · SOLVER" title={label("Thuật toán & Cross", "Solver & Cross")} tip={label("Chọn hướng Cross, độ sâu mở đầu và chiến lược lớp cuối mặc định cho lần giải mới.", "Sets the default Cross orientation, opening depth, and last-layer strategy for new solves.")}>
          <label className="settings-label">{label("Màu Cross mặc định", "Default Cross color")}</label>
          <div className="grid grid-cols-6 gap-2">{colors.map((color) => <button key={color.value} onClick={() => setSolver((current) => ({ ...current, crossColor: color.value }))} className={solver.crossColor === color.value ? "settings-color active" : "settings-color"} title={label(color.vi, color.en)}><span style={{ backgroundColor: color.hex }} /></button>)}</div>
          <label className="settings-label">{label("Mở đầu", "Opening")}</label>
          <div className="settings-chip-grid">{openings.map((option) => <button key={option.value} onClick={() => setSolver((current) => ({ ...current, opening: option.value }))} className={solver.opening === option.value ? "active" : ""}>{option.label}</button>)}</div>
          <label className="settings-label mt-4 flex items-center justify-between"><span>{label("Độ sâu direct opening", "Direct opening depth")}</span><b className="font-mono text-[#1b7b5e]">{solver.openingDepth}</b></label>
          <input aria-label={label("Độ sâu direct opening", "Direct opening depth")} type="range" min="4" max="10" step="1" value={solver.openingDepth} onChange={(event) => setSolver((current) => ({ ...current, openingDepth: Number(event.target.value) }))} className="w-full accent-[#1ba77a]" />
          <p className="mt-1 font-mono text-[9px] leading-4 text-[#17221d]/55">{label("Áp dụng đồng thời cho XCross đến XXXXCross. Depth cao hơn tìm kỹ hơn nhưng chậm hơn.", "Applies to XCross through XXXXCross. Higher depth searches harder but takes longer.")}</p>
          <label className="settings-label">{label("Lớp cuối", "Last layer")}</label>
          <div className="settings-chip-grid">{lastLayers.map((option) => <button key={option.value} onClick={() => setSolver((current) => ({ ...current, lastLayer: option.value }))} className={solver.lastLayer === option.value ? "active" : ""}>{option.label}</button>)}</div>
          <label className="settings-label">{label("Ưu tiên / loại trừ F2L", "Prefer / exclude F2L")}</label>
          <div className="settings-chip-grid"><button onClick={() => setSolver((current) => ({ ...current, preferredSlot: undefined }))} className={!solver.preferredSlot ? "active" : ""}>{label("Tự do", "Any")}</button>{f2lSlots.map((slot) => <button key={slot} disabled={solver.excludedSlots.includes(slot)} onClick={() => setSolver((current) => ({ ...current, preferredSlot: current.preferredSlot === slot ? undefined : slot }))} className={solver.preferredSlot === slot ? "active" : ""}>{slot}</button>)}</div>
          <div className="settings-chip-grid mt-1">{f2lSlots.map((slot) => <button key={slot} onClick={() => setSolver((current) => ({ ...current, preferredSlot: current.preferredSlot === slot ? undefined : current.preferredSlot, excludedSlots: current.excludedSlots.includes(slot) ? current.excludedSlots.filter((value) => value !== slot) : [...current.excludedSlots, slot] }))} className={solver.excludedSlots.includes(slot) ? "active" : ""}>{label("Loại", "Skip")} {slot}</button>)}</div>
        </SettingCard>

        <SettingCard index="02 · TIMER" title="Inspection & Input" tip={label("Bật âm báo inspection, kiểm soát Speed split và lựa chọn highlight Cross trong preview 3D.", "Controls inspection audio, Speed split, and Cross highlight in the 3D preview.")}>
          <div className="mt-3 space-y-2"><button onClick={() => setSound(!sound)} className={sound ? "settings-toggle active" : "settings-toggle"}><span>{label("Âm inspection", "Inspection sound")}</span><b>{sound ? "ON" : "OFF"}</b></button><button onClick={() => setSplits(!splits)} className={splits ? "settings-toggle active" : "settings-toggle"}><span>Speed split</span><b>{splits ? "ON" : "OFF"}</b></button><button onClick={() => setHighlight(!highlight)} className={highlight ? "settings-toggle active" : "settings-toggle"}><span>{label("Highlight Cross", "Cross highlight")}</span><b>{highlight ? "ON" : "OFF"}</b></button></div>
        </SettingCard>

        {splits && <SettingCard index="03 · SPEED SPLIT" title={label("Mục tiêu pha", "Phase targets")} tip={label("Các ngưỡng này chỉ dùng khi Speed split bật để báo pha Cross, F2L, OLL và PLL chậm hơn mục tiêu.", "These limits appear only with Speed split and flag Cross, F2L, OLL, or PLL phases that exceed the target.")}><div className="mt-3 space-y-2">{(Object.keys(targets) as Phase[]).map((phase) => <label key={phase} className="settings-number"><span>{phase}</span><input type="number" min="0.1" max="120" step="0.1" value={targets[phase]} onChange={(event) => setTarget(phase, Number(event.target.value))} /><em>s</em></label>)}</div></SettingCard>}

        <SettingCard index="04 · STUDY" title={label("Mục tiêu & ngôn ngữ", "Goal & language")} tip={label("Đặt số case ôn mỗi ngày cho Study Bay và thay đổi ngôn ngữ toàn ứng dụng ngay lập tức.", "Sets the daily Study Bay review count and changes the application language immediately.")}>
          <label className="settings-number mt-3"><span>{label("Case / ngày", "Cases / day")}</span><input type="number" min="1" max="200" value={dailyGoal} onChange={(event) => setDailyGoal(Math.max(1, Math.min(200, Number(event.target.value) || 1)))} /><em>{label("case", "cases")}</em></label>
          <div className="settings-chip-grid mt-4"><button onClick={() => setLanguage("vi")} className={vi ? "active" : ""}>Tiếng Việt</button><button onClick={() => setLanguage("en")} className={!vi ? "active" : ""}>English</button></div>
        </SettingCard>

        <SettingCard index="05 · DISPLAY" title={label("Giao diện", "Appearance")} tip={label("Chỉ giữ tùy chọn Sáng, Tối hoặc theo hệ điều hành. Màu nhấn và cỡ chữ được thống nhất để giao diện luôn dễ đọc.", "Keep Light, Dark, or System appearance. Accent and text scale are fixed for a consistent readable interface.")}>
          <label className="settings-label mt-3">{label("Chế độ màu", "Color mode")}</label>
          <div className="settings-chip-grid"><button onClick={() => setThemeMode("light")} className={themeMode === "light" ? "active" : ""}><Sun className="mr-1 inline h-3.5 w-3.5" />{label("Sáng", "Light")}</button><button onClick={() => setThemeMode("dark")} className={themeMode === "dark" ? "active" : ""}><Moon className="mr-1 inline h-3.5 w-3.5" />Dark</button><button onClick={() => setThemeMode("system")} className={themeMode === "system" ? "active" : ""}>{label("Hệ điều hành", "System")}</button></div>
          <p className="mt-2 font-mono text-[8px] text-[#17221d]/55">{themeMode === "system" ? (theme === "dark" ? label("Hệ điều hành hiện đang dùng Dark.", "System is currently using Dark.") : label("Hệ điều hành hiện đang dùng Sáng.", "System is currently using Light.")) : label("Lựa chọn này ghi đè giao diện hệ điều hành.", "This choice overrides the system appearance.")}</p>

          <p className="mt-4 text-sm leading-6 text-[#17221d]/60">{label("Giao diện dùng bảng màu và typography cố định để mọi màn hình Rubik giữ nhịp đọc nhất quán.", "The interface uses a fixed palette and typography to keep every Rubik screen consistently readable.")}</p>
        </SettingCard>
      </div>
      <div className="settings-actions"><button onClick={reset} className="settings-reset"><RotateCcw />{label("Khôi phục", "Reset")}</button><button onClick={save} className="settings-save">{saved ? <Check /> : null}{saved ? label("Đã lưu", "Saved") : label("Lưu cài đặt", "Save settings")}</button></div>
    </div>
  </main>;
}
