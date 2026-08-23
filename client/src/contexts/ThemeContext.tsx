import { createContext, useContext, useEffect, useState } from "react";
import { applyAppThemeMode, readAppThemeMode, writeAppThemeMode, type AppThemeMode } from "@/lib/displaySettings";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  themeMode: AppThemeMode;
  setThemeMode: (mode: AppThemeMode) => void;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({ children, defaultTheme = "light", switchable = false }: ThemeProviderProps) {
  const [themeMode, setThemeModeState] = useState<AppThemeMode>(() => switchable ? readAppThemeMode() : defaultTheme);
  const [theme, setTheme] = useState<Theme>(() => switchable ? applyAppThemeMode(readAppThemeMode()) : defaultTheme);

  useEffect(() => {
    if (!switchable) return;
    const apply = () => setTheme(applyAppThemeMode(themeMode));
    apply();
    if (themeMode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applySystemChange = () => setTheme(applyAppThemeMode("system", true));
    media.addEventListener("change", applySystemChange);
    return () => media.removeEventListener("change", applySystemChange);
  }, [themeMode, switchable]);

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
  }, [theme]);

  const setThemeMode = (mode: AppThemeMode) => {
    if (!switchable) return;
    setTheme(writeAppThemeMode(mode));
    setThemeModeState(mode);
  };

  const toggleTheme = switchable ? () => setThemeMode(theme === "light" ? "dark" : "light") : undefined;

  return <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, toggleTheme, switchable }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
