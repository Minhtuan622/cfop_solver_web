// Derives a readable set of theme tokens from one or two seed colors.
//
// The person picks a primary and an accent color; everything that must stay
// legible next to them (hover, soft chip background, the text drawn on top)
// is computed here and nudged in lightness until it clears WCAG AA against the
// fixed surfaces of the chosen mode. See docs/validation/contrast-report.md.

export type ThemeMode = "light" | "dark";

export type DerivedToken =
  | "primary"
  | "primary-hover"
  | "primary-soft"
  | "on-primary"
  | "accent"
  | "accent-soft"
  | "chart-1"
  | "chart-2";

export type DerivedTokens = Record<DerivedToken, string>;

export const DERIVED_TOKEN_NAMES: readonly DerivedToken[] = [
  "primary",
  "primary-hover",
  "primary-soft",
  "on-primary",
  "accent",
  "accent-soft",
  "chart-1",
  "chart-2",
];

// Surfaces the derived colors are measured against. They mirror index.css;
// server/themeColors.test.ts fails if the two drift apart.
export const SURFACE_TOKENS = {
  light: {
    canvas: "#f8f7f3",
    surface: "#fdfcfa",
    "surface-2": "#f0eee8",
    "surface-3": "#e7e4dc",
    "menu-hover": "#f0eee8",
  },
  dark: {
    canvas: "#161616",
    surface: "#1f1f1e",
    "surface-2": "#2a2a28",
    "surface-3": "#353532",
    "menu-hover": "#474743",
  },
} as const satisfies Record<ThemeMode, Record<string, string>>;

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_PATTERN.test(value);
}

export function normalizeHex(value: string): string | null {
  const text = value.trim().toLowerCase();
  if (HEX_PATTERN.test(text)) return text;
  if (/^[0-9a-f]{6}$/.test(text)) return `#${text}`;
  const short = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(text);
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : null;
}

type Oklch = { l: number; c: number; h: number };

function toLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function fromLinear(channel: number): number {
  const clamped = Math.min(1, Math.max(0, channel));
  return clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToRgb(hex).map(value => toLinear(value / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: lightness, c: Math.hypot(a, bb), h: Math.atan2(bb, a) };
}

function linearRgb({ l, c, h }: Oklch): [number, number, number] {
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const l_ = Math.pow(l + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m_ = Math.pow(l - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s_ = Math.pow(l - 0.0894841775 * a - 1.291485548 * b, 3);
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

function inGamut(color: Oklch): boolean {
  return linearRgb(color).every(channel => channel >= -0.0005 && channel <= 1.0005);
}

function oklchToHex(color: Oklch): string {
  let { c } = color;
  if (!inGamut({ ...color, c })) {
    let low = 0;
    let high = c;
    for (let i = 0; i < 20; i += 1) {
      const mid = (low + high) / 2;
      if (inGamut({ ...color, c: mid })) low = mid;
      else high = mid;
    }
    c = low;
  }
  return (
    "#" +
    linearRgb({ ...color, c })
      .map(channel =>
        Math.round(fromLinear(channel) * 255)
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  );
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(value => toLinear(value / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(first: string, second: string): number {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const TEXT_MIN = 4.5;
// The chroma ceiling keeps a neon seed from turning every chip into a highlighter.
const MAX_SOFT_CHROMA = 0.04;

type Surfaces = Record<string, string>;

function soft(seed: Oklch, mode: ThemeMode): string {
  return oklchToHex({
    l: mode === "light" ? 0.965 : 0.28,
    c: Math.min(seed.c, mode === "light" ? MAX_SOFT_CHROMA : 0.05),
    h: seed.h,
  });
}

// Walk lightness away from the seed (darker on light surfaces, lighter on dark
// ones) until the color reads on every given background. Keeps hue and as much
// chroma as the sRGB gamut allows at that lightness.
function readableOn(seed: Oklch, mode: ThemeMode, backgrounds: string[]): string {
  const step = mode === "light" ? -0.005 : 0.005;
  const start = mode === "light" ? Math.min(seed.l, 0.9) : Math.max(seed.l, 0.4);
  let fallback = oklchToHex({ ...seed, l: start });
  for (let l = start; l >= 0 && l <= 1; l += step) {
    const hex = oklchToHex({ l, c: seed.c, h: seed.h });
    fallback = hex;
    if (backgrounds.every(background => contrastRatio(hex, background) >= TEXT_MIN)) return hex;
  }
  return fallback;
}

function shift(color: string, mode: ThemeMode, amount: number): string {
  const { l, c, h } = hexToOklch(color);
  return oklchToHex({ l: mode === "light" ? l - amount : l + amount, c, h });
}

export function deriveTokens(primarySeed: string, accentSeed: string, mode: ThemeMode): DerivedTokens {
  const surfaces: Surfaces = SURFACE_TOKENS[mode];
  const surfaceList = Object.values(surfaces);

  const primarySeedOklch = hexToOklch(primarySeed);
  const primarySoft = soft(primarySeedOklch, mode);
  const primary = readableOn(primarySeedOklch, mode, [...surfaceList, primarySoft]);

  // Light mode draws white text on the fill; dark mode draws near-black text.
  const primaryHue = hexToOklch(primary).h;
  const onPrimary =
    mode === "light"
      ? "#ffffff"
      : oklchToHex({ l: 0.18, c: 0.03, h: primaryHue });

  const accentSeedOklch = hexToOklch(accentSeed);
  const accentSoft = soft(accentSeedOklch, mode);
  const accent = readableOn(accentSeedOklch, mode, [...surfaceList, accentSoft]);

  return {
    primary,
    "primary-hover": shift(primary, mode, 0.06),
    "primary-soft": primarySoft,
    "on-primary": onPrimary,
    accent,
    "accent-soft": accentSoft,
    "chart-1": primary,
    "chart-2": accent,
  };
}
