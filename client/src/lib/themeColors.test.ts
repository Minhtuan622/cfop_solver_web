import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_THEME_COLORS,
  THEME_COLORS_STORAGE_KEY,
  applyThemeColors,
  customColors,
  parseThemeColors,
  presetColors,
  readThemeColors,
  saveThemeColors,
} from "./themeColors";

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("style");
});

describe("themeColors storage", () => {
  it("falls back to the default for missing or broken data", () => {
    expect(readThemeColors()).toEqual(DEFAULT_THEME_COLORS);
    window.localStorage.setItem(THEME_COLORS_STORAGE_KEY, "{oops");
    expect(readThemeColors()).toEqual(DEFAULT_THEME_COLORS);
    expect(parseThemeColors({ v: 1, preset: "custom", primary: "red", accent: "#000000" })).toEqual(
      DEFAULT_THEME_COLORS
    );
    expect(parseThemeColors({ v: 9, preset: "custom", primary: "#112233", accent: "#445566" })).toEqual(
      DEFAULT_THEME_COLORS
    );
  });

  it("round-trips a custom pair and caches tokens for both modes", () => {
    const colors = customColors("#AA3300", "#0044cc");
    expect(colors).not.toBeNull();
    saveThemeColors(colors!);
    expect(readThemeColors()).toEqual({ preset: "custom", primary: "#aa3300", accent: "#0044cc" });
    const stored = JSON.parse(window.localStorage.getItem(THEME_COLORS_STORAGE_KEY)!);
    expect(stored.tokens.light.primary).toMatch(/^#[0-9a-f]{6}$/);
    expect(stored.tokens.dark["on-primary"]).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("takes a preset's colors from the code, not from storage", () => {
    window.localStorage.setItem(
      THEME_COLORS_STORAGE_KEY,
      JSON.stringify({ v: 1, preset: "rose", primary: "#000000", accent: "#000000" })
    );
    expect(readThemeColors()).toEqual(presetColors("rose"));
  });

  it("removes the key when the default is saved", () => {
    saveThemeColors(presetColors("indigo")!);
    saveThemeColors(DEFAULT_THEME_COLORS);
    expect(window.localStorage.getItem(THEME_COLORS_STORAGE_KEY)).toBeNull();
  });

  it("rejects an invalid custom hex", () => {
    expect(customColors("zzz", "#000000")).toBeNull();
  });
});

describe("applyThemeColors", () => {
  it("sets and then clears the token overrides", () => {
    const root = document.documentElement;
    applyThemeColors(presetColors("indigo")!, "light");
    expect(root.style.getPropertyValue("--primary")).toMatch(/^#[0-9a-f]{6}$/);
    expect(root.style.getPropertyValue("--on-primary")).toBe("#ffffff");
    applyThemeColors(DEFAULT_THEME_COLORS, "light");
    expect(root.style.getPropertyValue("--primary")).toBe("");
  });
});
