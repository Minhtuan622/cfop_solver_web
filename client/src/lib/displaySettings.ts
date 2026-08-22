export type AppFontSize = "small" | "medium" | "large";
export type AppTheme = "light" | "dark";

const FONT_SIZE_KEY = "cfop-app-font-size-v1";
const THEME_KEY = "theme";

export function readAppFontSize(): AppFontSize {
  try { const stored = localStorage.getItem(FONT_SIZE_KEY); return stored === "small" || stored === "large" ? stored : "medium"; } catch { return "medium"; }
}

export function applyAppFontSize(size: AppFontSize) { document.documentElement.dataset.fontSize = size; }
export function writeAppFontSize(size: AppFontSize) { localStorage.setItem(FONT_SIZE_KEY, size); applyAppFontSize(size); }

export function readAppTheme(): AppTheme {
  try { return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light"; } catch { return "light"; }
}

export function applyAppTheme(theme: AppTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
}

export function writeAppTheme(theme: AppTheme) {
  localStorage.setItem(THEME_KEY, theme);
  applyAppTheme(theme);
}
