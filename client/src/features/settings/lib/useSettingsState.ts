import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { readLastLayerStudy, writeLastLayerStudy } from "@/features/last-layer/lib";
import { DEFAULT_SOLVER_SETTINGS, HIDE_RUNNING_TIME_KEY, readSolverSettings, writeSolverSettings, type SolverSettings } from "@/lib/appSettings";
import { readStoredValue, writeStoredValue } from "@/lib/browserStorage";

export type F2LSlot = NonNullable<SolverSettings["preferredSlot"]>;

export type SettingsSaveState = "idle" | "saving" | "saved";

export function useSettingsState() {
  const { language } = useLanguage();
  const [solver, setSolver] = useState<SolverSettings>(readSolverSettings);
  const [sound, setSound] = useState(() => readStoredValue("cfop-inspection-sound") !== "off");
  const [voice, setVoice] = useState(() => readStoredValue("cfop-inspection-voice") !== "off");
  const [metronome, setMetronome] = useState(() => readStoredValue("cfop-metronome") === "on");
  const [metronomeBpm, setMetronomeBpm] = useState(() => {
    const stored = Number(readStoredValue("cfop-metronome-bpm"));
    return Number.isFinite(stored) && stored >= 30 && stored <= 240 ? Math.round(stored) : 60;
  });
  const [hideRunningTime, setHideRunningTime] = useState(() => readStoredValue(HIDE_RUNNING_TIME_KEY) === "on");
const [scrambleSize, setScrambleSize] = useState<"sm" | "md" | "lg">(() => {
  const stored = readStoredValue("cfop-scramble-size");
  return stored === "sm" || stored === "lg" ? stored : "md";
});
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
      writeStoredValue("cfop-inspection-voice", voice ? "on" : "off");
      writeStoredValue("cfop-metronome", metronome ? "on" : "off");
      writeStoredValue("cfop-metronome-bpm", String(metronomeBpm));
      writeStoredValue(HIDE_RUNNING_TIME_KEY, hideRunningTime ? "on" : "off");
      writeStoredValue("cfop-scramble-size", scrambleSize);
      writeLastLayerStudy({ ...readLastLayerStudy(), dailyGoal });
      setSaveState("saved");
    }, 350);
    return () => window.clearTimeout(id);
  }, [solver, sound, voice, metronome, metronomeBpm, hideRunningTime, dailyGoal, scrambleSize, language]);

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
  const reset = () => { setSolver(DEFAULT_SOLVER_SETTINGS); setSound(true); setVoice(true); setMetronome(false); setMetronomeBpm(60); setHideRunningTime(false); setScrambleSize("md"); setDailyGoal(12); };

  return {
    solver,
    sound,
    voice,
    metronome,
    metronomeBpm,
    hideRunningTime,
    scrambleSize,
    dailyGoal,
    saveState,
    updateSolver,
    toggleExcluded,
    setSound,
    setVoice,
    setMetronome,
    setMetronomeBpm,
    setHideRunningTime,
    setScrambleSize,
    setDailyGoal,
    reset,
  };
}
