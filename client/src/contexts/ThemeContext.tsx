import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_THEME_COLORS,
  applyThemeColors,
  readThemeColors,
  saveThemeColors,
  type ThemeColors,
} from "@/lib/themeColors";
import { DARK_SCHEME_QUERY, applyTheme, readTheme, resolveTheme, saveTheme, type ResolvedTheme, type Theme } from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  resolved: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  colors: ThemeColors;
  setColors: (colors: ThemeColors) => void;
  resetColors: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readTheme());
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(readTheme()));

  const [colors, setColorsState] = useState<ThemeColors>(() => readThemeColors());

  const setColors = useCallback((next: ThemeColors) => {
    saveThemeColors(next);
    setColorsState(next);
  }, []);

  const resetColors = useCallback(() => setColors(DEFAULT_THEME_COLORS), [setColors]);

  useEffect(() => {
    applyThemeColors(colors, resolved);
  }, [colors, resolved]);

  const setTheme = useCallback((next: Theme) => {
    saveTheme(next);
    setThemeState(next);
    setResolved(applyTheme(next));
  }, []);

  useEffect(() => {
    setResolved(applyTheme(theme));
    if (theme !== "system" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(DARK_SCHEME_QUERY);
    const onSchemeChange = () => setResolved(applyTheme("system"));
    query.addEventListener("change", onSchemeChange);
    return () => query.removeEventListener("change", onSchemeChange);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => ({ theme, resolved, setTheme, colors, setColors, resetColors }),
    [colors, resetColors, resolved, setColors, setTheme, theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside a <ThemeProvider>.");
  return context;
}
