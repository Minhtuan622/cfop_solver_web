/**
 * The theme the app offers: a fixed light palette, a fixed dark palette, or
 * whatever the operating system asks for.
 */
export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "cfop-theme";
export const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

/** The theme the visitor picked last, or "system" when they never picked one. */
export function readTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function saveTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // A blocked storage quota must never stop the theme from being applied.
  }
}

export function prefersDarkScheme(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(DARK_SCHEME_QUERY).matches;
}

/** The palette that is actually shown once "system" is resolved. */
export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") return prefersDarkScheme() ? "dark" : "light";
  return theme;
}

/**
 * Writes the resolved palette to the document. Bootstrap reads
 * `data-bs-theme` from the root element, so the whole app follows it.
 */
export function applyTheme(theme: Theme): ResolvedTheme {
  const resolved = resolveTheme(theme);
  document.documentElement.dataset.bsTheme = resolved;
  return resolved;
}
