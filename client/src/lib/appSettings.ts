import { z } from "zod";
import { readStoredJson, writeStoredValue } from "./browserStorage";

export type SolverSettings = {
  crossColor: "U" | "R" | "F" | "D" | "L" | "B";
  opening: "cross" | "auto" | "xcross" | "xxcross" | "xxxcross" | "xxxxcross";
  openingDepth: number;
  openingFindResult: boolean;
  directNodeBudget: number;
  lastLayer: "auto" | "oll_pll" | "zbll" | "1lll";
  preferredSlot?: "FR" | "FL" | "BL" | "BR";
  excludedSlots: ("FR" | "FL" | "BL" | "BR")[];
};

const SOLVER_SETTINGS_KEY = "cfop-app-solver-settings-v1";

export const HIDE_RUNNING_TIME_KEY = "cfop-hide-running-time";
export const DEFAULT_SOLVER_SETTINGS: SolverSettings = {
  crossColor: "D",
  opening: "cross",
  openingDepth: 8,
  openingFindResult: false,
  directNodeBudget: 5000,
  lastLayer: "auto",
  excludedSlots: [],
};

const boundedInt = (min: number, max: number, fallback: number) =>
  z
    .number()
    .finite()
    .transform(value => Math.round(Math.min(max, Math.max(min, value))))
    .prefault(fallback)
    .catch(fallback);

const slotEnum = z.enum(["FR", "FL", "BL", "BR"]);

const solverSettingsSchema = z.object({
  crossColor: z
    .enum(["U", "R", "F", "D", "L", "B"])
    .prefault(DEFAULT_SOLVER_SETTINGS.crossColor)
    .catch(DEFAULT_SOLVER_SETTINGS.crossColor),
  opening: z
    .enum(["cross", "auto", "xcross", "xxcross", "xxxcross", "xxxxcross"])
    .prefault(DEFAULT_SOLVER_SETTINGS.opening)
    .catch(DEFAULT_SOLVER_SETTINGS.opening),
  openingDepth: boundedInt(4, 12, DEFAULT_SOLVER_SETTINGS.openingDepth),
  openingFindResult: z.unknown().transform(value => Boolean(value)).prefault(false),
  directNodeBudget: boundedInt(500, 2_000_000, DEFAULT_SOLVER_SETTINGS.directNodeBudget),
  lastLayer: z
    .enum(["auto", "oll_pll", "zbll", "1lll"])
    .prefault(DEFAULT_SOLVER_SETTINGS.lastLayer)
    .catch(DEFAULT_SOLVER_SETTINGS.lastLayer),
  preferredSlot: slotEnum.optional().catch(undefined),
  excludedSlots: z
    .array(z.unknown())
    .transform(items =>
      items
        .filter((slot): slot is NonNullable<SolverSettings["preferredSlot"]> =>
          slotEnum.safeParse(slot).success,
        )
        .slice(0, 4),
    )
    .prefault([])
    .catch([]),
});

export function readSolverSettings(): SolverSettings {
  try {
    const raw = readStoredJson<Partial<SolverSettings>>(SOLVER_SETTINGS_KEY, {});
    return solverSettingsSchema.parse(raw);
  } catch {
    return DEFAULT_SOLVER_SETTINGS;
  }
}

export function writeSolverSettings(next: SolverSettings) {
  writeStoredValue(SOLVER_SETTINGS_KEY, JSON.stringify(next));
}
