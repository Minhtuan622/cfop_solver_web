export type AppFontSize = "small" | "medium" | "large";
export type AppFontScale = number;
export type FormulaScale = number;
export type AppTheme = "light" | "dark";
export type AppThemeMode = AppTheme | "system";
export type AppAccent = "mint" | "sky" | "violet" | "coral" | "custom";

const FONT_SCALE_KEY = "cfop-app-font-scale-v2";
const FORMULA_SCALE_KEY = "cfop-formula-scale-v1";
const LEGACY_FONT_SIZE_KEY = "cfop-app-font-size-v1";
const THEME_KEY = "theme";
const ACCENT_KEY = "cfop-app-accent-v1";
const CUSTOM_ACCENT_KEY = "cfop-app-custom-accent-v1";
const HEX = /^#[0-9a-fA-F]{6}$/;

export const MIN_FONT_SCALE = 80;
export const MAX_FONT_SCALE = 140;
export const DEFAULT_FONT_SCALE = 100;
export const MIN_FORMULA_SCALE = 80;
export const MAX_FORMULA_SCALE = 180;
export const DEFAULT_FORMULA_SCALE = 100;
export function clampAppFontScale(value: number) { return Math.round(Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, Number.isFinite(value) ? value : DEFAULT_FONT_SCALE))); }
export function readAppFontScale(): AppFontScale {
  try {
    const stored = Number(localStorage.getItem(FONT_SCALE_KEY));
    if (Number.isFinite(stored) && stored > 0) return clampAppFontScale(stored);
    const legacy = localStorage.getItem(LEGACY_FONT_SIZE_KEY);
    return legacy === "small" ? 88 : legacy === "large" ? 112 : DEFAULT_FONT_SCALE;
  } catch { return DEFAULT_FONT_SCALE; }
}
export function applyAppFontScale(scale: AppFontScale) { const normalized = clampAppFontScale(scale); document.documentElement.dataset.fontScale = String(normalized); document.documentElement.style.fontSize = `${normalized}%`; }
export function writeAppFontScale(scale: AppFontScale) { const normalized = clampAppFontScale(scale); localStorage.setItem(FONT_SCALE_KEY, String(normalized)); applyAppFontScale(normalized); return normalized; }

export function clampFormulaScale(value: number) { return Math.round(Math.min(MAX_FORMULA_SCALE, Math.max(MIN_FORMULA_SCALE, Number.isFinite(value) ? value : DEFAULT_FORMULA_SCALE))); }
export function readFormulaScale(): FormulaScale { try { const stored = Number(localStorage.getItem(FORMULA_SCALE_KEY)); return Number.isFinite(stored) && stored > 0 ? clampFormulaScale(stored) : DEFAULT_FORMULA_SCALE; } catch { return DEFAULT_FORMULA_SCALE; } }
export function applyFormulaScale(scale: FormulaScale) { const normalized = clampFormulaScale(scale); const root = document.documentElement; root.dataset.formulaScale = String(normalized); root.style.setProperty("--formula-scale", String(normalized / 100)); }
export function writeFormulaScale(scale: FormulaScale) { const normalized = clampFormulaScale(scale); localStorage.setItem(FORMULA_SCALE_KEY, String(normalized)); applyFormulaScale(normalized); return normalized; }

export function readAppThemeMode(): AppThemeMode { try { const stored = localStorage.getItem(THEME_KEY); return stored === "dark" || stored === "system" ? stored : "light"; } catch { return "light"; } }
export function resolveAppTheme(mode: AppThemeMode): AppTheme { return mode === "system" ? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light") : mode; }
let themeTransitionTimer: number | undefined;
function pulseThemeTransition() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const root = document.documentElement;
  root.dataset.themeTransition = "true";
  if (themeTransitionTimer) window.clearTimeout(themeTransitionTimer);
  themeTransitionTimer = window.setTimeout(() => { delete root.dataset.themeTransition; }, 260);
}
export function applyAppThemeMode(mode: AppThemeMode, animate = false) { const theme = resolveAppTheme(mode); if (animate) pulseThemeTransition(); document.documentElement.classList.toggle("dark", theme === "dark"); document.documentElement.dataset.theme = theme; document.documentElement.dataset.themeMode = mode; return theme; }
export function writeAppThemeMode(mode: AppThemeMode) { localStorage.setItem(THEME_KEY, mode); return applyAppThemeMode(mode, true); }
export function readAppTheme(): AppTheme { return resolveAppTheme(readAppThemeMode()); }
export function applyAppTheme(theme: AppTheme, animate = false) { if (animate) pulseThemeTransition(); document.documentElement.classList.toggle("dark", theme === "dark"); document.documentElement.dataset.theme = theme; }
export function writeAppTheme(theme: AppTheme) { return writeAppThemeMode(theme); }

export function isValidAccentColor(value: string): value is `#${string}` { return HEX.test(value); }
export function readCustomAppAccent() { try { const stored = localStorage.getItem(CUSTOM_ACCENT_KEY) ?? "#1ba77a"; return isValidAccentColor(stored) ? stored.toLowerCase() : "#1ba77a"; } catch { return "#1ba77a"; } }
export function readAppAccent(): AppAccent { try { const stored = localStorage.getItem(ACCENT_KEY); return stored === "sky" || stored === "violet" || stored === "coral" || stored === "custom" ? stored : "mint"; } catch { return "mint"; } }
function customInk(hex: string) { const value = hex.slice(1); const r = Number.parseInt(value.slice(0, 2), 16); const g = Number.parseInt(value.slice(2, 4), 16); const b = Number.parseInt(value.slice(4, 6), 16); return ((r * 299 + g * 587 + b * 114) / 1000) > 150 ? "#102018" : "#f5faf7"; }
function customSoft(hex: string) { const value = hex.slice(1); const r = Number.parseInt(value.slice(0, 2), 16); const g = Number.parseInt(value.slice(2, 4), 16); const b = Number.parseInt(value.slice(4, 6), 16); return `rgb(${r} ${g} ${b} / .16)`; }
export function applyAppAccent(accent: AppAccent) { const root = document.documentElement; root.dataset.accent = accent; if (accent !== "custom") { root.style.removeProperty("--workbench-accent"); root.style.removeProperty("--workbench-accent-ink"); root.style.removeProperty("--workbench-accent-soft"); return; } const hex = readCustomAppAccent(); root.style.setProperty("--workbench-accent", hex); root.style.setProperty("--workbench-accent-ink", customInk(hex)); root.style.setProperty("--workbench-accent-soft", customSoft(hex)); }
export function writeAppAccent(accent: Exclude<AppAccent, "custom">) { localStorage.setItem(ACCENT_KEY, accent); applyAppAccent(accent); }
export function writeCustomAppAccent(hex: string) { if (!isValidAccentColor(hex)) return false; const normalized = hex.toLowerCase(); localStorage.setItem(CUSTOM_ACCENT_KEY, normalized); localStorage.setItem(ACCENT_KEY, "custom"); applyAppAccent("custom"); return true; }
