import { describe, expect, it } from "vitest";
import { SURFACE_TOKENS, contrastRatio, deriveTokens, normalizeHex, type ThemeMode } from "./colorScale";
import { COLOR_PRESETS } from "./themeColors";

const MODES: ThemeMode[] = ["light", "dark"];

function hsvHex(hue: number, saturation: number, value: number): string {
  const f = (n: number) => {
    const k = (n + hue / 60) % 6;
    return value - value * saturation * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return (
    "#" +
    [f(5), f(3), f(1)]
      .map(channel => Math.round(channel * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

describe("deriveTokens", () => {
  const seeds: string[] = [];
  for (let hue = 0; hue < 360; hue += 15) {
    for (const [s, v] of [[1, 1], [0.9, 0.4], [0.3, 0.95], [1, 0.15]]) seeds.push(hsvHex(hue, s, v));
  }
  seeds.push("#000000", "#ffffff", "#808080", "#ffff00");

  for (const mode of MODES) {
    it(`keeps every pair readable in ${mode} mode for any seed`, () => {
      const failures: string[] = [];
      for (const seed of seeds) {
        const accentSeed = seeds[(seeds.indexOf(seed) * 7 + 3) % seeds.length];
        const tokens = deriveTokens(seed, accentSeed, mode);
        const check = (id: string, fg: string, bg: string, min: number) => {
          const ratio = contrastRatio(fg, bg);
          if (ratio < min) failures.push(`${mode} ${seed}/${accentSeed} ${id} ${ratio.toFixed(2)}`);
        };
        check("on-primary/primary", tokens["on-primary"], tokens.primary, 4.5);
        check("primary/soft", tokens.primary, tokens["primary-soft"], 4.5);
        check("accent/soft", tokens.accent, tokens["accent-soft"], 4.5);
        for (const [name, surface] of Object.entries(SURFACE_TOKENS[mode])) {
          check(`primary/${name}`, tokens.primary, surface, 4.5);
          check(`primary-hover/${name}`, tokens["primary-hover"], surface, 4.5);
          check(`accent/${name}`, tokens.accent, surface, 4.5);
        }
      }
      expect(failures).toEqual([]);
    });
  }

  it("returns valid hex for every token", () => {
    const tokens = deriveTokens("#4f46e5", "#0891b2", "dark");
    for (const value of Object.values(tokens)) expect(value).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("only nudges lightness of a seed that is already close to readable", () => {
    const tokens = deriveTokens("#007f6c", "#1d6fa5", "light");
    expect(contrastRatio(tokens.primary, SURFACE_TOKENS.light.canvas)).toBeLessThan(6.5);
    expect(tokens.primary.slice(1, 3)).toBe("00");
    expect(tokens["chart-1"]).toBe(tokens.primary);
  });

  it("makes every preset readable", () => {
    for (const preset of COLOR_PRESETS) {
      for (const mode of MODES) {
        const tokens = deriveTokens(preset.primary, preset.accent, mode);
        expect(contrastRatio(tokens["on-primary"], tokens.primary)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe("normalizeHex", () => {
  it("accepts 3 and 6 digit codes with or without #", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("00ff7f")).toBe("#00ff7f");
    expect(normalizeHex("nope")).toBeNull();
  });
});
