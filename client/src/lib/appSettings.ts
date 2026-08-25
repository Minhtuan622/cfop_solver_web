export type SolverSettings = {
  crossColor: "U" | "R" | "F" | "D" | "L" | "B";
  opening: "cross" | "auto" | "xxcross" | "xxxcross" | "xxxxcross";
  openingDepth: number;
  openingFindResult: boolean;
  directNodeBudget: number;
  lastLayer: "auto" | "oll_pll" | "zbll" | "1lll";
  preferredSlot?: "FR" | "FL" | "BL" | "BR";
  excludedSlots: ("FR" | "FL" | "BL" | "BR")[];
};

const SOLVER_SETTINGS_KEY = "cfop-app-solver-settings-v1";
export const DEFAULT_SOLVER_SETTINGS: SolverSettings = { crossColor: "U", opening: "cross", openingDepth: 8, openingFindResult: false, directNodeBudget: 5000, lastLayer: "auto", excludedSlots: [] };

const COLORS = new Set<SolverSettings["crossColor"]>(["U", "R", "F", "D", "L", "B"]);
const OPENINGS = new Set<SolverSettings["opening"]>(["cross", "auto", "xxcross", "xxxcross", "xxxxcross"]);
const LAST_LAYERS = new Set<SolverSettings["lastLayer"]>(["auto", "oll_pll", "zbll", "1lll"]);
const SLOTS = new Set<NonNullable<SolverSettings["preferredSlot"]>>(["FR", "FL", "BL", "BR"]);

export function readSolverSettings(): SolverSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(SOLVER_SETTINGS_KEY) ?? "{}") as Partial<SolverSettings>;
    return {
      crossColor: COLORS.has(raw.crossColor as SolverSettings["crossColor"]) ? raw.crossColor as SolverSettings["crossColor"] : DEFAULT_SOLVER_SETTINGS.crossColor,
      opening: OPENINGS.has(raw.opening as SolverSettings["opening"]) ? raw.opening as SolverSettings["opening"] : DEFAULT_SOLVER_SETTINGS.opening,
      openingDepth: Number.isFinite(raw.openingDepth) ? Math.max(4, Math.min(10, Math.round(raw.openingDepth as number))) : DEFAULT_SOLVER_SETTINGS.openingDepth,
      openingFindResult: Boolean(raw.openingFindResult),
      directNodeBudget: Number.isFinite(raw.directNodeBudget) ? Math.max(500, Math.min(50_000, Math.round(raw.directNodeBudget as number))) : DEFAULT_SOLVER_SETTINGS.directNodeBudget,
      lastLayer: LAST_LAYERS.has(raw.lastLayer as SolverSettings["lastLayer"]) ? raw.lastLayer as SolverSettings["lastLayer"] : DEFAULT_SOLVER_SETTINGS.lastLayer,
      preferredSlot: SLOTS.has(raw.preferredSlot as NonNullable<SolverSettings["preferredSlot"]>) ? raw.preferredSlot as NonNullable<SolverSettings["preferredSlot"]> : undefined,
      excludedSlots: Array.isArray(raw.excludedSlots) ? raw.excludedSlots.filter((slot): slot is NonNullable<SolverSettings["preferredSlot"]> => SLOTS.has(slot as NonNullable<SolverSettings["preferredSlot"]>)).slice(0, 4) : [],
    };
  } catch { return DEFAULT_SOLVER_SETTINGS; }
}

export function writeSolverSettings(next: SolverSettings) {
  localStorage.setItem(SOLVER_SETTINGS_KEY, JSON.stringify(next));
}
