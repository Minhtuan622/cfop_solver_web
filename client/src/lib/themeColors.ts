import { z } from "zod";
import {
  DERIVED_TOKEN_NAMES,
  deriveTokens,
  isHexColor,
  normalizeHex,
  type DerivedTokens,
  type ThemeMode,
} from "./colorScale";

export const THEME_COLORS_STORAGE_KEY = "cfop-theme-colors";
const STORAGE_VERSION = 1;

export type ColorPreset = {
  id: string;
  primary: string;
  accent: string;
};

// "default" keeps the stock palette from index.css untouched.
export const DEFAULT_COLOR_PRESET_ID = "default";
export const CUSTOM_COLOR_PRESET_ID = "custom";

export const COLOR_PRESETS: readonly ColorPreset[] = [
  { id: DEFAULT_COLOR_PRESET_ID, primary: "#007f6c", accent: "#1d6fa5" },
  { id: "indigo", primary: "#4f46e5", accent: "#0891b2" },
  { id: "violet", primary: "#7c3aed", accent: "#db2777" },
  { id: "rose", primary: "#e11d48", accent: "#7c3aed" },
  { id: "amber", primary: "#d97706", accent: "#0f766e" },
  { id: "graphite", primary: "#475569", accent: "#0369a1" },
];

export type ThemeColors = {
  preset: string;
  primary: string;
  accent: string;
};

export const DEFAULT_THEME_COLORS: ThemeColors = {
  preset: DEFAULT_COLOR_PRESET_ID,
  primary: COLOR_PRESETS[0].primary,
  accent: COLOR_PRESETS[0].accent,
};

const storedSchema = z.object({
  v: z.literal(STORAGE_VERSION),
  preset: z.string(),
  primary: z.string().refine(isHexColor),
  accent: z.string().refine(isHexColor),
});

export function isDefaultColors(colors: ThemeColors): boolean {
  return colors.preset === DEFAULT_COLOR_PRESET_ID;
}

export function presetColors(id: string): ThemeColors | null {
  const preset = COLOR_PRESETS.find(item => item.id === id);
  return preset ? { preset: preset.id, primary: preset.primary, accent: preset.accent } : null;
}

export function customColors(primary: string, accent: string): ThemeColors | null {
  const nextPrimary = normalizeHex(primary);
  const nextAccent = normalizeHex(accent);
  if (!nextPrimary || !nextAccent) return null;
  return { preset: CUSTOM_COLOR_PRESET_ID, primary: nextPrimary, accent: nextAccent };
}

export function parseThemeColors(value: unknown): ThemeColors {
  const parsed = storedSchema.safeParse(value);
  if (!parsed.success) return DEFAULT_THEME_COLORS;
  const { preset, primary, accent } = parsed.data;
  const known = presetColors(preset);
  if (known) return known;
  return { preset: CUSTOM_COLOR_PRESET_ID, primary: primary.toLowerCase(), accent: accent.toLowerCase() };
}

export function readThemeColors(): ThemeColors {
  try {
    const raw = window.localStorage.getItem(THEME_COLORS_STORAGE_KEY);
    return raw ? parseThemeColors(JSON.parse(raw)) : DEFAULT_THEME_COLORS;
  } catch {
    return DEFAULT_THEME_COLORS;
  }
}

// The computed tokens are stored next to the seeds only so the inline script in
// index.html can paint them before the bundle loads. The app recomputes them
// from the seeds on every read and never trusts the stored copy.
export function saveThemeColors(colors: ThemeColors): void {
  try {
    if (isDefaultColors(colors)) {
      window.localStorage.removeItem(THEME_COLORS_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(
      THEME_COLORS_STORAGE_KEY,
      JSON.stringify({
        v: STORAGE_VERSION,
        ...colors,
        tokens: {
          light: deriveTokens(colors.primary, colors.accent, "light"),
          dark: deriveTokens(colors.primary, colors.accent, "dark"),
        },
      })
    );
  } catch {
  }
}

export function themeColorTokens(colors: ThemeColors, mode: ThemeMode): DerivedTokens | null {
  return isDefaultColors(colors) ? null : deriveTokens(colors.primary, colors.accent, mode);
}

export function applyThemeColors(colors: ThemeColors, mode: ThemeMode): void {
  const root = document.documentElement;
  for (const name of DERIVED_TOKEN_NAMES) root.style.removeProperty(`--${name}`);
  const tokens = themeColorTokens(colors, mode);
  if (tokens) {
    for (const name of DERIVED_TOKEN_NAMES) root.style.setProperty(`--${name}`, tokens[name]);
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", tokens?.primary ?? DEFAULT_THEME_COLORS.primary);
}
