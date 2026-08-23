export type AppTheme = "light" | "dark";
export type AppThemeMode = AppTheme | "system";

const THEME_KEY = "theme";

export function readAppThemeMode(): AppThemeMode {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "dark" || stored === "system" ? stored : "light";
  } catch {
    return "light";
  }
}

export function resolveAppTheme(mode: AppThemeMode): AppTheme {
  return mode === "system" ? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light") : mode;
}

let themeTransitionTimer: number | undefined;

function pulseThemeTransition() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const root = document.documentElement;
  root.dataset.themeTransition = "true";
  if (themeTransitionTimer) window.clearTimeout(themeTransitionTimer);
  themeTransitionTimer = window.setTimeout(() => { delete root.dataset.themeTransition; }, 220);
}

export function applyAppThemeMode(mode: AppThemeMode, animate = false) {
  const theme = resolveAppTheme(mode);
  if (animate) pulseThemeTransition();
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themeMode = mode;
  return theme;
}

export function writeAppThemeMode(mode: AppThemeMode) {
  localStorage.setItem(THEME_KEY, mode);
  return applyAppThemeMode(mode, true);
}
