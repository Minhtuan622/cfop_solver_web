import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { readLastLayerStudy, writeLastLayerStudy } from "@/features/last-layer/lib";
import { DEFAULT_SOLVER_SETTINGS, readSolverSettings, writeSolverSettings, type SolverSettings } from "@/lib/appSettings";
import { readStoredValue, writeStoredValue } from "@/lib/browserStorage";

/** The F2L slots the solver can prefer or leave out. */
export type F2LSlot = NonNullable<SolverSettings["preferredSlot"]>;

/** What the page tells the visitor about its own saving. */
export type SettingsSaveState = "idle" | "saving" | "saved";

/**
 * Owns every value of the settings page and writes it back as it changes, so
 * the page itself only has to lay the groups out.
 */
export function useSettingsState() {
  const { language } = useLanguage();
  const [solver, setSolver] = useState<SolverSettings>(readSolverSettings);
  const [sound, setSound] = useState(() => readStoredValue("cfop-inspection-sound") !== "off");
  const [splits, setSplits] = useState(() => readStoredValue("cfop-space-splits") !== "off");
  const [highlight, setHighlight] = useState(() => readStoredValue("cfop-cross-highlight") !== "off");
  const [dailyGoal, setDailyGoal] = useState(() => readLastLayerStudy().dailyGoal);
  const [saveState, setSaveState] = useState<SettingsSaveState>("idle");
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

  return {
    solver,
    sound,
    splits,
    highlight,
    dailyGoal,
    saveState,
    updateSolver,
    toggleExcluded,
    setSound,
    setSplits,
    setHighlight,
    setDailyGoal,
    reset,
  };
}
