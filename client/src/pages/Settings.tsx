/** Bootstrap settings for cubers: CFOP defaults first, then timer and study preferences. */
import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw } from "@/components/ui/BootstrapIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { DEFAULT_SOLVER_SETTINGS, readSolverSettings, writeSolverSettings, type SolverSettings } from "@/lib/appSettings";
import { readLastLayerStudy, writeLastLayerStudy } from "@/features/last-layer";
import { readStoredValue, writeStoredValue } from "@/lib/browserStorage";

type F2LSlot = NonNullable<SolverSettings["preferredSlot"]>;

const colors: { value: SolverSettings["crossColor"]; hex: string; labelKey: string }[] = [
  { value: "U", hex: "#f7f3e9", labelKey: "settings.color.white" }, { value: "D", hex: "#e7c34f", labelKey: "settings.color.yellow" },
  { value: "F", hex: "#1ba77a", labelKey: "settings.color.green" }, { value: "B", hex: "#3b6fc7", labelKey: "settings.color.blue" },
  { value: "R", hex: "#d95743", labelKey: "settings.color.red" }, { value: "L", hex: "#ed8e42", labelKey: "settings.color.orange" },
];
const slots: F2LSlot[] = ["FR", "FL", "BL", "BR"];

function Switch({ id, checked, onChange, label, help }: { id: string; checked: boolean; onChange: (next: boolean) => void; label: string; help?: string }) {
  return <div className="form-check form-switch"><input id={id} className="form-check-input" type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} /><label className="form-check-label" htmlFor={id}>{label}{help ? <small className="d-block text-body-secondary">{help}</small> : null}</label></div>;
}

export default function Settings() {
  const { language, vi, setLanguage, t } = useLanguage();
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
    { value: "cross", label: t("settings.opening.cross") }, { value: "auto", label: t("settings.opening.auto") },
    { value: "xxcross", label: t("settings.opening.xxcross") }, { value: "xxxcross", label: t("settings.opening.xxxcross") }, { value: "xxxxcross", label: t("settings.opening.xxxxcross") },
  ];
  const lastLayerOptions: { value: SolverSettings["lastLayer"]; label: string }[] = [
    { value: "auto", label: t("settings.lastLayer.auto") },
    { value: "oll_pll", label: t("settings.lastLayer.ollpll") }, { value: "zbll", label: t("settings.lastLayer.zbll") }, { value: "1lll", label: t("settings.lastLayer.oneLll") },
  ];

  return <div className="container py-3"><div className="row g-3"><section className="col-12 col-xl-8"><div className="card"><div className="card-body"><div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4"><div><h1 className="h4 mb-1">{t("settings.title")}</h1><p className="text-body-secondary mb-0">{t("settings.subtitle")}</p></div><span className="badge text-bg-secondary">CFOP</span></div><div className="accordion" id="cuber-settings">
    <section className="accordion-item"><h2 className="accordion-header"><button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#settings-cfop" aria-expanded="true" aria-controls="settings-cfop">{t("settings.cfopSection")}</button></h2><div id="settings-cfop" className="accordion-collapse collapse show"><div className="accordion-body"><div className="vstack gap-4">
      <div><label className="form-label">{t("settings.crossColor")}</label><div className="d-flex flex-wrap gap-2" role="radiogroup" aria-label={t("settings.crossColor")}>{colors.map((color) => <button key={color.value} type="button" role="radio" aria-checked={solver.crossColor === color.value} onClick={() => updateSolver({ crossColor: color.value })} className={solver.crossColor === color.value ? "btn btn-primary p-1" : "btn btn-outline-secondary p-1"} title={t(color.labelKey)} aria-label={t(color.labelKey)}><span className="d-block rounded" style={{ backgroundColor: color.hex, width: "1.5rem", height: "1.5rem" }} /></button>)}</div><p className="small text-body-secondary mb-0 mt-2">{t("settings.crossColorHint")}</p></div>
      <div><label className="form-label" htmlFor="setting-opening">{t("settings.opening")}</label><select id="setting-opening" value={solver.opening} onChange={(event) => updateSolver({ opening: event.target.value as SolverSettings["opening"] })} className="form-select">{openingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><p className="small text-body-secondary mb-0 mt-2">{t("settings.openingHint")}</p></div>
      {solver.opening !== "cross" ? <><div className="row g-3"><label className="col-12 col-md-6"><span className="form-label d-flex justify-content-between">{t("settings.openingDepth")}<strong>{solver.openingDepth}</strong></span><input aria-label={t("settings.openingDepth")} type="range" min="4" max="10" step="1" value={solver.openingDepth} onChange={(event) => updateSolver({ openingDepth: Number(event.target.value) })} className="form-range" /><small className="text-body-secondary">{t("settings.openingDepthHint")}</small></label><label className="col-12 col-md-6"><span className="form-label d-flex justify-content-between">{t("settings.nodeBudget")}<strong>{solver.directNodeBudget.toLocaleString()}</strong></span><input aria-label={t("settings.nodeBudget")} type="range" min="500" max="50000" step="500" value={solver.directNodeBudget} onChange={(event) => updateSolver({ directNodeBudget: Number(event.target.value) })} className="form-range" /><small className="text-body-secondary">{t("settings.nodeBudgetHint")}</small></label></div><Switch id="setting-direct-only" checked={solver.openingFindResult} onChange={(openingFindResult) => updateSolver({ openingFindResult })} label={t("settings.directOnly")} help={t("settings.directOnlyHelp")} /><div><label className="form-label">{t("settings.preferredSlot")}</label><div className="btn-group w-100" role="group"><button type="button" onClick={() => updateSolver({ preferredSlot: undefined })} className={!solver.preferredSlot ? "btn btn-primary" : "btn btn-outline-secondary"}>{t("settings.auto")}</button>{slots.map((slot) => <button key={slot} type="button" disabled={solver.excludedSlots.includes(slot)} onClick={() => updateSolver({ preferredSlot: solver.preferredSlot === slot ? undefined : slot })} className={solver.preferredSlot === slot ? "btn btn-primary" : "btn btn-outline-secondary"}>{slot}</button>)}</div><label className="form-label mt-3">{t("settings.excludeSlots")}</label><div className="btn-group w-100" role="group">{slots.map((slot) => <button key={`exclude-${slot}`} type="button" onClick={() => toggleExcluded(slot)} className={solver.excludedSlots.includes(slot) ? "btn btn-danger" : "btn btn-outline-secondary"}>{slot}</button>)}</div></div></> : null}
      <div><label className="form-label" htmlFor="setting-last-layer">{t("settings.lastLayer")}</label><select id="setting-last-layer" value={solver.lastLayer} onChange={(event) => updateSolver({ lastLayer: event.target.value as SolverSettings["lastLayer"] })} className="form-select">{lastLayerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><p className="small text-body-secondary mb-0 mt-2">{t("settings.lastLayerHint")}</p></div>
    </div></div></div></section>
    <section className="accordion-item"><h2 className="accordion-header"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#settings-timer" aria-expanded="false" aria-controls="settings-timer">{t("settings.timerSection")}</button></h2><div id="settings-timer" className="accordion-collapse collapse"><div className="accordion-body"><div className="vstack gap-3"><Switch id="setting-sound" checked={sound} onChange={setSound} label={t("settings.sound")} help={t("settings.soundHelp")} /><Switch id="setting-highlight" checked={highlight} onChange={setHighlight} label={t("settings.highlight")} help={t("settings.highlightHelp")} /><Switch id="setting-splits" checked={splits} onChange={setSplits} label={t("settings.splits")} help={t("settings.splitsHelp")} /></div></div></div></section>
    <section className="accordion-item"><h2 className="accordion-header"><button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#settings-study" aria-expanded="false" aria-controls="settings-study">{t("settings.studySection")}</button></h2><div id="settings-study" className="accordion-collapse collapse"><div className="accordion-body"><div className="row g-3"><label className="col-12 col-sm-6"><span className="form-label">{t("settings.dailyGoal")}</span><input className="form-control" type="number" min="1" max="200" value={dailyGoal} onChange={(event) => setDailyGoal(Math.max(1, Math.min(200, Number(event.target.value) || 1)))} /><small className="text-body-secondary">{t("settings.dailyGoalHelp")}</small></label><div className="col-12 col-sm-6"><span className="form-label d-block">{t("settings.language")}</span><div className="btn-group"><button type="button" onClick={() => setLanguage("vi")} className={vi ? "btn btn-primary" : "btn btn-outline-secondary"}>Tiếng Việt</button><button type="button" onClick={() => setLanguage("en")} className={!vi ? "btn btn-primary" : "btn btn-outline-secondary"}>English</button></div></div></div></div></div></section>
  </div></div><div className="card-footer d-flex flex-wrap justify-content-between align-items-center gap-2"><button type="button" onClick={reset} className="btn btn-outline-secondary btn-sm"><RotateCcw className="fs-6 me-1" />{t("settings.restoreDefaults")}</button><span className="small text-body-secondary" role="status" aria-live="polite">{saveState === "saving" ? t("settings.saving") : saveState === "saved" ? <><Check className="fs-6 me-1" />{t("settings.saved")}</> : t("settings.autoSave")}</span></div></div></section><aside className="col-12 col-xl-4"><div className="alert alert-info mb-0"><h2 className="h6">{t("settings.directNote")}</h2><p className="mb-0">{t("settings.directNoteDetail")}</p></div></aside></div></div>;
}
