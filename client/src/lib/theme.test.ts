import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DARK_SCHEME_QUERY, THEME_STORAGE_KEY, applyTheme, isTheme, readTheme, resolveTheme, saveTheme } from "./theme";

function stubMatchMedia(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const query = {
    matches,
    media: DARK_SCHEME_QUERY,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => query));
  return listeners;
}

describe("theme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-bs-theme");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("recognises only the three supported modes", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("system")).toBe(true);
    expect(isTheme("sepia")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });

  it("falls back to the system mode when nothing was stored", () => {
    expect(readTheme()).toBe("system");
  });

  it("reads back a stored mode and ignores an unknown one", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(readTheme()).toBe("dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, "neon");
    expect(readTheme()).toBe("system");
  });

  it("persists the chosen mode", () => {
    saveTheme("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("keeps a fixed mode regardless of the system preference", () => {
    stubMatchMedia(true);
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });

  it("resolves the system mode from the operating system preference", () => {
    stubMatchMedia(true);
    expect(resolveTheme("system")).toBe("dark");
    vi.unstubAllGlobals();
    stubMatchMedia(false);
    expect(resolveTheme("system")).toBe("light");
  });

  it("writes the resolved palette to the document root", () => {
    expect(applyTheme("dark")).toBe("dark");
    expect(document.documentElement.dataset.bsTheme).toBe("dark");
    expect(applyTheme("light")).toBe("light");
    expect(document.documentElement.dataset.bsTheme).toBe("light");
  });

  it("writes the system palette to the document root", () => {
    stubMatchMedia(true);
    expect(applyTheme("system")).toBe("dark");
    expect(document.documentElement.dataset.bsTheme).toBe("dark");
  });
});
