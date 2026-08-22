/** Xưởng Cơ Khí Tốc Độ — one settings hub; settings live here, not inside working surfaces. */
import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { DEFAULT_SOLVER_SETTINGS, readSolverSettings, writeSolverSettings, type SolverSettings } from "@/lib/appSettings";
import { readLastLayerStudy, writeLastLayerStudy } from "@/lib/lastLayerStudy";

const colors: { value: SolverSettings["crossColor"]; hex: string; vi: string; en: string }[] = [
  { value: "U", hex: "#f7f3e9", vi: "Trắng", en: "White" }, { value: "D", hex: "#e7c34f", vi: "Vàng", en: "Yellow" },
  { value: "F", hex: "#1ba77a", vi: "Xanh lá", en: "Green" }, { value: "B", hex: "#3b6fc7", vi: "Xanh dương", en: "Blue" },
  { value: "R", hex: "#d95743", vi: "Đỏ", en: "Red" }, { value: "L", hex: "#ed8e42", vi: "Cam", en: "Orange" },
];
const openings: { value: SolverSettings["opening"]; label: string }[] = [{ value: "cross", label: "Cross" }, { value: "auto", label: "XCross" }, { value: "xxcross", label: "XXCross" }, { value: "xxxcross", label: "XXXCross" }, { value: "xxxxcross", label: "XXXXCross" }];
const lastLayers: { value: SolverSettings["lastLayer"]; label: string }[] = [{ value: "auto", label: "Auto" }, { value: "oll_pll", label: "OLL + PLL" }, { value: "zbll", label: "ZBLL" }, { value: "1lll", label: "1LLL" }];
const f2lSlots = ["FR", "FL", "BL", "BR"] as const;
const defaultTargets = { Cross: 4, F2L: 12, OLL: 4, PLL: 5 };
type Phase = keyof typeof defaultTargets;
function readTargets() { try { const raw = JSON.parse(localStorage.getItem("cfop-phase-targets") ?? "{}") as Partial<Record<Phase, number>>; return { Cross: raw.Cross ?? 4, F2L: raw.F2L ?? 12, OLL: raw.OLL ?? 4, PLL: raw.PLL ?? 5 }; } catch { return defaultTargets; } }

export default function Settings() {
  const { language } = useLanguage();
  const vi = language === "vi";
  const [solver, setSolver] = useState<SolverSettings>(readSolverSettings);
  const [sound, setSound] = useState(() => localStorage.getItem("cfop-inspection-sound") !== "off");
  const [splits, setSplits] = useState(() => localStorage.getItem("cfop-space-splits") !== "off");
  const [highlight, setHighlight] = useState(() => localStorage.getItem("cfop-cross-highlight") !== "off");
  const [targets, setTargets] = useState(readTargets);
  const [dailyGoal, setDailyGoal] = useState(() => readLastLayerStudy().dailyGoal);
  const [saved, setSaved] = useState(false);
  const save = () => { writeSolverSettings(solver); localStorage.setItem("cfop-inspection-color", solver.crossColor); localStorage.setItem("cfop-inspection-sound", sound ? "on" : "off"); localStorage.setItem("cfop-space-splits", splits ? "on" : "off"); localStorage.setItem("cfop-cross-highlight", highlight ? "on" : "off"); localStorage.setItem("cfop-phase-targets", JSON.stringify(targets)); const study = readLastLayerStudy(); writeLastLayerStudy({ ...study, dailyGoal }); setSaved(true); window.setTimeout(() => setSaved(false), 2200); };
  const reset = () => { setSolver(DEFAULT_SOLVER_SETTINGS); setSound(true); setSplits(true); setHighlight(true); setTargets(defaultTargets); setDailyGoal(12); };
  const setTarget = (phase: Phase, value: number) => { if (Number.isFinite(value) && value > 0) setTargets((current) => ({ ...current, [phase]: value })); };
  return <main className="settings-page min-h-screen bg-[#f4f0e8] text-[#17221d]"><div className="settings-workbench mx-auto max-w-5xl px-4 py-7 sm:px-6">
    <div className="settings-heading"><p>{vi ? "CẤU HÌNH HỆ THỐNG" : "SYSTEM CONFIGURATION"}</p><h1>{vi ? "Cài đặt" : "Settings"}</h1><span>{vi ? "Một nơi duy nhất cho Solver, Timer và Study." : "One place for Solver, Timer, and Study."}</span></div>
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <section className="settings-sheet"><p className="settings-kicker">01 · SOLVER</p><h2>{vi ? "Thuật toán & Cross" : "Solver & Cross"}</h2>
        <label className="settings-label">{vi ? "Màu Cross mặc định" : "Default Cross color"}</label><div className="grid grid-cols-6 gap-2">{colors.map((color) => <button key={color.value} onClick={() => setSolver((current) => ({ ...current, crossColor: color.value }))} className={solver.crossColor === color.value ? "settings-color active" : "settings-color"} title={vi ? color.vi : color.en}><span style={{ backgroundColor: color.hex }} /></button>)}</div>
        <label className="settings-label">{vi ? "Mở đầu" : "Opening"}</label><div className="settings-chip-grid">{openings.map((option) => <button key={option.value} onClick={() => setSolver((current) => ({ ...current, opening: option.value }))} className={solver.opening === option.value ? "active" : ""}>{option.label}</button>)}</div>
        <label className="settings-label">{vi ? "Lớp cuối" : "Last layer"}</label><div className="settings-chip-grid">{lastLayers.map((option) => <button key={option.value} onClick={() => setSolver((current) => ({ ...current, lastLayer: option.value }))} className={solver.lastLayer === option.value ? "active" : ""}>{option.label}</button>)}</div>
        <label className="settings-label">{vi ? "Ưu tiên slot F2L" : "Preferred F2L slot"}</label><div className="settings-chip-grid"><button onClick={() => setSolver((current) => ({ ...current, preferredSlot: undefined }))} className={!solver.preferredSlot ? "active" : ""}>{vi ? "Tự do" : "Any"}</button>{f2lSlots.map((slot) => <button key={slot} disabled={solver.excludedSlots.includes(slot)} onClick={() => setSolver((current) => ({ ...current, preferredSlot: current.preferredSlot === slot ? undefined : slot }))} className={solver.preferredSlot === slot ? "active" : ""}>{slot}</button>)}</div>
        <label className="settings-label">{vi ? "Loại trừ slot F2L" : "Exclude F2L slots"}</label><div className="settings-chip-grid">{f2lSlots.map((slot) => <button key={slot} onClick={() => setSolver((current) => ({ ...current, preferredSlot: current.preferredSlot === slot ? undefined : current.preferredSlot, excludedSlots: current.excludedSlots.includes(slot) ? current.excludedSlots.filter((value) => value !== slot) : [...current.excludedSlots, slot] }))} className={solver.excludedSlots.includes(slot) ? "active" : ""}>{slot}</button>)}</div>
      </section>
      <section className="settings-sheet"><p className="settings-kicker">02 · TIMER</p><h2>Inspection & Input</h2><div className="mt-4 space-y-2">
        <button onClick={() => setSound(!sound)} className={sound ? "settings-toggle active" : "settings-toggle"}><span>{vi ? "Âm inspection" : "Inspection sound"}</span><b>{sound ? "ON" : "OFF"}</b></button>
        <button onClick={() => setSplits(!splits)} className={splits ? "settings-toggle active" : "settings-toggle"}><span>{vi ? "Speed split" : "Speed splits"}</span><b>{splits ? "ON" : "OFF"}</b></button>
        <button onClick={() => setHighlight(!highlight)} className={highlight ? "settings-toggle active" : "settings-toggle"}><span>{vi ? "Highlight Cross" : "Cross highlight"}</span><b>{highlight ? "ON" : "OFF"}</b></button>
      </div><p className="settings-hint">{vi ? "Timer luôn dùng giữ–thả Space/Enter hoặc chạm để bắt đầu." : "Timer always uses hold–release Space/Enter or touch to start."}</p></section>
      <section className="settings-sheet"><p className="settings-kicker">03 · MỤC TIÊU TIMER</p><h2>{vi ? "Ngưỡng pha · giây" : "Phase targets · seconds"}</h2><div className="mt-4 space-y-3">{(Object.keys(targets) as Phase[]).map((phase) => <label key={phase} className="settings-number"><span>{phase}</span><input type="number" min="0.1" max="120" step="0.1" value={targets[phase]} onChange={(event) => setTarget(phase, Number(event.target.value))} /><em>s</em></label>)}</div></section>
      <section className="settings-sheet"><p className="settings-kicker">04 · ZBLL / 1LLL STUDY</p><h2>{vi ? "Mục tiêu học hằng ngày" : "Daily study goal"}</h2><label className="settings-number mt-4"><span>{vi ? "Số case" : "Cases"}</span><input type="number" min="1" max="200" value={dailyGoal} onChange={(event) => setDailyGoal(Math.max(1, Math.min(200, Number(event.target.value) || 1)))} /><em>{vi ? "/ ngày" : "/ day"}</em></label><p className="settings-hint">{vi ? "Study Bay dùng mục tiêu này để tính tiến độ và thông báo hoàn thành." : "Study Bay uses this goal for progress and completion feedback."}</p></section>
    </div><div className="settings-actions"><button onClick={reset} className="settings-reset"><RotateCcw />{vi ? "Khôi phục mặc định" : "Reset defaults"}</button><button onClick={save} className="settings-save">{saved ? <Check /> : null}{saved ? (vi ? "Đã lưu" : "Saved") : (vi ? "Lưu cài đặt" : "Save settings")}</button></div>
  </div></main>;
}
