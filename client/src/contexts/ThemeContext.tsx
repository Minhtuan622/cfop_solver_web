import { createContext, useContext, useEffect, useState } from "react";
import { applyAppThemeMode, readAppThemeMode, type AppThemeMode } from "@/lib/displaySettings";

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
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [themeMode, switchable]);

  const setThemeMode = (mode: AppThemeMode) => {
    if (!switchable) return;
    localStorage.setItem("theme", mode);
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
