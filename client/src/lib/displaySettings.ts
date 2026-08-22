export type AppFontSize = "small" | "medium" | "large";
export type AppTheme = "light" | "dark";
export type AppThemeMode = AppTheme | "system";
export type AppAccent = "mint" | "sky" | "violet" | "coral";

const FONT_SIZE_KEY = "cfop-app-font-size-v1";
const THEME_KEY = "theme";
const ACCENT_KEY = "cfop-app-accent-v1";

export function readAppFontSize(): AppFontSize { try { const stored = localStorage.getItem(FONT_SIZE_KEY); return stored === "small" || stored === "large" ? stored : "medium"; } catch { return "medium"; } }
export function applyAppFontSize(size: AppFontSize) { document.documentElement.dataset.fontSize = size; }
export function writeAppFontSize(size: AppFontSize) { localStorage.setItem(FONT_SIZE_KEY, size); applyAppFontSize(size); }

export function readAppThemeMode(): AppThemeMode { try { const stored = localStorage.getItem(THEME_KEY); return stored === "dark" || stored === "system" ? stored : "light"; } catch { return "light"; } }
export function resolveAppTheme(mode: AppThemeMode): AppTheme { return mode === "system" ? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light") : mode; }
export function applyAppThemeMode(mode: AppThemeMode) { const theme = resolveAppTheme(mode); document.documentElement.classList.toggle("dark", theme === "dark"); document.documentElement.dataset.theme = theme; document.documentElement.dataset.themeMode = mode; return theme; }
export function writeAppThemeMode(mode: AppThemeMode) { localStorage.setItem(THEME_KEY, mode); return applyAppThemeMode(mode); }
export function readAppTheme(): AppTheme { return resolveAppTheme(readAppThemeMode()); }
export function applyAppTheme(theme: AppTheme) { document.documentElement.classList.toggle("dark", theme === "dark"); document.documentElement.dataset.theme = theme; }
export function writeAppTheme(theme: AppTheme) { return writeAppThemeMode(theme); }

export function readAppAccent(): AppAccent { try { const stored = localStorage.getItem(ACCENT_KEY); return stored === "sky" || stored === "violet" || stored === "coral" ? stored : "mint"; } catch { return "mint"; } }
export function applyAppAccent(accent: AppAccent) { document.documentElement.dataset.accent = accent; }
export function writeAppAccent(accent: AppAccent) { localStorage.setItem(ACCENT_KEY, accent); applyAppAccent(accent); }
