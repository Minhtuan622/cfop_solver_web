import { useState } from "react";
import { readSolverSettings } from "@/lib/appSettings";
import type {
  CrossColor,
  F2LSlot,
  LastLayerMode,
  OpeningMode,
} from "@/lib/solverRuntime";

export function useSolverSettingsState() {
  const [crossColor, setCrossColor] = useState<CrossColor>(
    () => readSolverSettings().crossColor
  );
  const [opening, setOpening] = useState<OpeningMode>(
    () => readSolverSettings().opening
  );
  const [openingDepth, setOpeningDepth] = useState(
    () => readSolverSettings().openingDepth
  );
  const [openingFindResult, setOpeningFindResult] = useState(
    () => readSolverSettings().openingFindResult
  );
  const [directNodeBudget, setDirectNodeBudget] = useState(
    () => readSolverSettings().directNodeBudget
  );
  const [lastLayer, setLastLayer] = useState<LastLayerMode>(
    () => readSolverSettings().lastLayer
  );
  const [preferredSlot, setPreferredSlot] = useState<F2LSlot | undefined>(
    () => readSolverSettings().preferredSlot
  );
  const [excludedSlots, setExcludedSlots] = useState<F2LSlot[]>(
    () => readSolverSettings().excludedSlots
  );

  const resetDefaults = () => {
    const defaults = readSolverSettings();
    setCrossColor(defaults.crossColor);
    setOpening(defaults.opening);
    setOpeningDepth(defaults.openingDepth);
    setOpeningFindResult(defaults.openingFindResult);
    setDirectNodeBudget(defaults.directNodeBudget);
    setLastLayer(defaults.lastLayer);
    setPreferredSlot(defaults.preferredSlot);
    setExcludedSlots(defaults.excludedSlots);
  };

  return {
    crossColor,
    setCrossColor,
    opening,
    openingDepth,
    openingFindResult,
    directNodeBudget,
    lastLayer,
    preferredSlot,
    setPreferredSlot,
    excludedSlots,
    setExcludedSlots,
    resetDefaults,
  };
}
