export type AppFontSize = "small" | "medium" | "large";
export type AppTheme = "light" | "dark";
export type AppThemeMode = AppTheme | "system";
export type AppAccent = "mint" | "sky" | "violet" | "coral" | "custom";

const FONT_SIZE_KEY = "cfop-app-font-size-v1";
const THEME_KEY = "theme";
const ACCENT_KEY = "cfop-app-accent-v1";
const CUSTOM_ACCENT_KEY = "cfop-app-custom-accent-v1";
const HEX = /^#[0-9a-fA-F]{6}$/;

export function readAppFontSize(): AppFontSize { try { const stored = localStorage.getItem(FONT_SIZE_KEY); return stored === "small" || stored === "large" ? stored : "medium"; } catch { return "medium"; } }
export function applyAppFontSize(size: AppFontSize) { document.documentElement.dataset.fontSize = size; }
export function writeAppFontSize(size: AppFontSize) { localStorage.setItem(FONT_SIZE_KEY, size); applyAppFontSize(size); }

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
