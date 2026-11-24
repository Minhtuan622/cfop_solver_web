import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const css = readFileSync(path.join(root, "client", "src", "index.css"), "utf8");

type Rgb = { r: number; g: number; b: number; a: number };

function parseColor(raw: string): Rgb {
  const text = raw.trim().toLowerCase();
  if (text.startsWith("#")) {
    const hex = text.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      };
    }
    throw new Error(`Không đọc được màu hex "${raw}".`);
  }
  const match = text.match(/^rgba?\(([^)]+)\)$/);
  if (match) {
    const parts = match[1].split(",").map(part => Number(part.trim()));
    if (parts.length < 3 || parts.some(part => Number.isNaN(part))) {
      throw new Error(`Không đọc được màu "${raw}".`);
    }
    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: parts.length > 3 ? parts[3] : 1,
    };
  }
  throw new Error(`Định dạng màu không hỗ trợ: "${raw}".`);
}

function composite(foreground: Rgb, background: Rgb): Rgb {
  const alpha = foreground.a;
  return {
    r: foreground.r * alpha + background.r * (1 - alpha),
    g: foreground.g * alpha + background.g * (1 - alpha),
    b: foreground.b * alpha + background.b * (1 - alpha),
    a: 1,
  };
}

function relativeLuminance(color: Rgb): number {
  const channel = (value: number): number => {
    const srgb = value / 255;
    return srgb <= 0.03928
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * channel(color.r) +
    0.7152 * channel(color.g) +
    0.0722 * channel(color.b)
  );
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

function extractTokens(
  source: string,
  selector: RegExp,
  mode: string
): Record<string, string> {
  const match = selector.exec(source);
  if (!match) {
    throw new Error(`Không tìm thấy khối CSS của chế độ ${mode}.`);
  }
  const open = source.indexOf("{", match.index);
  const close = source.indexOf("}", open);
  const body = source.slice(open + 1, close);
  const tokens: Record<string, string> = {};
  for (const entry of body.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    tokens[entry[1]] = entry[2].trim();
  }
  return tokens;
}

const LIGHT = extractTokens(
  css,
  /:root,\s*\[data-theme="light"\]\s*\{/,
  "sáng"
);
const DARK = extractTokens(css, /\[data-theme="dark"\]\s*\{/, "tối");

type ColorRef = { token: string; alpha?: number } | { literal: string };

type Mode = "light" | "dark";

type Pair = {
  id: string;
  label: string;
  fg: ColorRef;
  bg: ColorRef;
  min: number;
  source: string;
};

const TEXT_MIN = 4.5;
const NON_TEXT_MIN = 3;

const PAIRS: Pair[] = [
  {
    id: "ink/canvas",
    label: "chữ chính trên nền trang",
    fg: { token: "ink" },
    bg: { token: "canvas" },
    min: TEXT_MIN,
    source: "client/src/index.css — body dùng text-ink trên bg-canvas",
  },
  {
    id: "ink/surface",
    label: "chữ chính trên nền thẻ",
    fg: { token: "ink" },
    bg: { token: "surface" },
    min: TEXT_MIN,
    source: "Card.tsx (cardClass = bg-surface)",
  },
  {
    id: "ink/surface-2",
    label: "chữ chính trên nền surface-2",
    fg: { token: "ink" },
    bg: { token: "surface-2" },
    min: TEXT_MIN,
    source: "Button.tsx variant soft (bg-surface-2 text-ink)",
  },
  {
    id: "muted/canvas",
    label: "chữ phụ trên nền trang",
    fg: { token: "muted" },
    bg: { token: "canvas" },
    min: TEXT_MIN,
    source: "client/src/index.css — text-muted trên bg-canvas",
  },
  {
    id: "muted/surface",
    label: "chữ phụ trên nền thẻ",
    fg: { token: "muted" },
    bg: { token: "surface" },
    min: TEXT_MIN,
    source: "Button.tsx variant ghost (bg-transparent text-muted)",
  },
  {
    id: "muted/surface-2",
    label: "chữ phụ trên nền surface-2",
    fg: { token: "muted" },
    bg: { token: "surface-2" },
    min: TEXT_MIN,
    source: "DesignSystem.tsx PillGroup (text-muted trên bg-surface-2)",
  },

  {
    id: "button/primary",
    label: "nút chính — chữ trên nền tím",
    fg: { token: "on-primary" },
    bg: { token: "primary" },
    min: TEXT_MIN,
    source: "Button.tsx variant primary (bg-primary text-on-primary)",
  },
  {
    id: "button/secondary",
    label: "nút phụ — chữ chính trên nền thẻ",
    fg: { token: "ink" },
    bg: { token: "surface" },
    min: TEXT_MIN,
    source: "Button.tsx variant secondary (bg-surface text-ink)",
  },
  {
    id: "button/soft",
    label: "nút soft — chữ chính trên nền surface-2",
    fg: { token: "ink" },
    bg: { token: "surface-2" },
    min: TEXT_MIN,
    source: "Button.tsx variant soft (bg-surface-2 text-ink)",
  },
  {
    id: "button/outline",
    label: "nút outline — chữ tím trên nền thẻ",
    fg: { token: "primary" },
    bg: { token: "surface" },
    min: TEXT_MIN,
    source: "Button.tsx variant outline (bg-transparent text-primary)",
  },
  {
    id: "button/outline@canvas",
    label: "nút outline — chữ tím trên nền trang",
    fg: { token: "primary" },
    bg: { token: "canvas" },
    min: TEXT_MIN,
    source: "Button.tsx variant outline trên nền trang",
  },
  {
    id: "button/ghost",
    label: "nút ghost — chữ phụ trên nền thẻ",
    fg: { token: "muted" },
    bg: { token: "surface" },
    min: TEXT_MIN,
    source: "Button.tsx variant ghost (bg-transparent text-muted)",
  },
  {
    id: "button/ghost@canvas",
    label: "nút ghost — chữ phụ trên nền trang",
    fg: { token: "muted" },
    bg: { token: "canvas" },
    min: TEXT_MIN,
    source: "Button.tsx variant ghost trên nền trang",
  },
  {
    id: "button/danger",
    label: "nút danger — chữ đỏ trên nền thẻ",
    fg: { token: "danger" },
    bg: { token: "surface" },
    min: TEXT_MIN,
    source: "Button.tsx variant danger (bg-transparent text-danger)",
  },
  {
    id: "button/danger@canvas",
    label: "nút danger — chữ đỏ trên nền trang",
    fg: { token: "danger" },
    bg: { token: "canvas" },
    min: TEXT_MIN,
    source: "Button.tsx variant danger trên nền trang",
  },
  {
    id: "button/dangerSolid",
    label: "nút dangerSolid — chữ trên nền đỏ",
    fg: { token: "on-danger" },
    bg: { token: "danger" },
    min: TEXT_MIN,
    source: "Button.tsx variant dangerSolid (bg-danger text-on-danger)",
  },
  {
    id: "button/success",
    label: "nút success — chữ xanh trên nền thẻ",
    fg: { token: "success" },
    bg: { token: "surface" },
    min: TEXT_MIN,
    source: "Button.tsx variant success (bg-transparent text-success)",
  },
  {
    id: "button/success@canvas",
    label: "nút success — chữ xanh trên nền trang",
    fg: { token: "success" },
    bg: { token: "canvas" },
    min: TEXT_MIN,
    source: "Button.tsx variant success trên nền trang",
  },
  {
    id: "button/successSolid",
    label: "nút successSolid — chữ trên nền xanh",
    fg: { token: "on-success" },
    bg: { token: "success" },
    min: TEXT_MIN,
    source: "bg-success text-on-success (Rooms.tsx, TimerLab.tsx, Profile.tsx)",
  },
  {
    id: "button/warning",
    label: "nút warning — chữ trên nền hổ phách",
    fg: { token: "on-warning" },
    bg: { token: "warning" },
    min: TEXT_MIN,
    source: "Button.tsx variant warning (bg-warning text-on-warning)",
  },
  {
    id: "button/inverse",
    label: "nút inverse — chữ surface trên nền ink",
    fg: { token: "surface" },
    bg: { token: "ink" },
    min: TEXT_MIN,
    source: "Button.tsx variant inverse (bg-ink text-surface)",
  },
  {
    id: "button/link",
    label: "nút link — chữ tím trên nền thẻ",
    fg: { token: "primary" },
    bg: { token: "surface" },
    min: TEXT_MIN,
    source: "Button.tsx variant link (bg-transparent text-primary)",
  },
  {
    id: "button/link@canvas",
    label: "nút link — chữ tím trên nền trang",
    fg: { token: "primary" },
    bg: { token: "canvas" },
    min: TEXT_MIN,
    source: "Button.tsx variant link trên nền trang",
  },

  {
    id: "menu/item",
    label: "mục menu — chữ chính trên nền menu",
    fg: { token: "ink" },
    bg: { token: "menu" },
    min: TEXT_MIN,
    source: "Dropdown.tsx / Select.tsx (bg-menu text-ink)",
  },
  {
    id: "menu/item-hover",
    label: "mục menu đang rê — chữ chính trên nền menu-hover",
    fg: { token: "ink" },
    bg: { token: "menu-hover" },
    min: TEXT_MIN,
    source: "data-[highlighted]:bg-menu-hover",
  },
  {
    id: "menu/check-hover",
    label: "dấu ✓ của mục đang chọn trên nền menu-hover",
    fg: { token: "primary" },
    bg: { token: "menu-hover" },
    min: NON_TEXT_MIN,
    source: "Select.tsx ItemIndicator (text-primary)",
  },

  {
    id: "chip/primary",
    label: "nhãn tím trên nền primary-soft",
    fg: { token: "primary" },
    bg: { token: "primary-soft" },
    min: TEXT_MIN,
    source: "DesignSystem.tsx IconBox (bg-primary-soft text-primary)",
  },
  {
    id: "chip/accent",
    label: "nhãn accent trên nền accent-soft",
    fg: { token: "accent" },
    bg: { token: "accent-soft" },
    min: TEXT_MIN,
    source: "token --accent / --accent-soft (chưa dùng cho chữ nào trong UI)",
  },

  {
    id: "input/text",
    label: "chữ trong ô nhập trên nền surface-3",
    fg: { token: "ink" },
    bg: { token: "surface-3" },
    min: TEXT_MIN,
    source: "FormControls.tsx controlBase (bg-surface-3 text-ink)",
  },
  {
    id: "input/placeholder",
    label: "chữ gợi ý trong ô nhập",
    fg: { token: "placeholder" },
    bg: { token: "surface-3" },
    min: TEXT_MIN,
    source: "FormControls.tsx controlBase (placeholder:text-placeholder)",
  },
  {
    id: "input/pillText",
    label: "chữ trong PillInput trên nền surface-2",
    fg: { token: "ink" },
    bg: { token: "surface-2" },
    min: TEXT_MIN,
    source: "DesignSystem.tsx PillInput (bg-surface-2 text-ink)",
  },
  {
    id: "input/pillPlaceholder",
    label: "chữ gợi ý trong PillInput",
    fg: { token: "placeholder" },
    bg: { token: "surface-2" },
    min: TEXT_MIN,
    source: "DesignSystem.tsx PillInput (placeholder:text-placeholder)",
  },

  {
    id: "focus/canvas",
    label: "vòng focus trên nền trang",
    fg: { token: "primary" },
    bg: { token: "canvas" },
    min: NON_TEXT_MIN,
    source: "client/src/index.css — :focus-visible dùng var(--primary)",
  },
  {
    id: "focus/surface",
    label: "vòng focus trên nền thẻ",
    fg: { token: "primary" },
    bg: { token: "surface" },
    min: NON_TEXT_MIN,
    source: "client/src/index.css — :focus-visible dùng var(--primary)",
  },
  {
    id: "focus/surface-2",
    label: "vòng focus trên nền surface-2",
    fg: { token: "primary" },
    bg: { token: "surface-2" },
    min: NON_TEXT_MIN,
    source: "client/src/index.css — :focus-visible dùng var(--primary)",
  },
  {
    id: "focus/surface-3",
    label: "vòng focus trên nền surface-3",
    fg: { token: "primary" },
    bg: { token: "surface-3" },
    min: NON_TEXT_MIN,
    source: "client/src/index.css — :focus-visible dùng var(--primary)",
  },

  {
    id: "icon/success",
    label: "biểu tượng xanh trên nền success-soft",
    fg: { token: "success" },
    bg: { token: "success-soft" },
    min: NON_TEXT_MIN,
    source: "DesignSystem.tsx Banner (bg-success-soft [&>svg]:text-success)",
  },
  {
    id: "icon/warning",
    label: "biểu tượng hổ phách trên nền warning-soft",
    fg: { token: "warning" },
    bg: { token: "warning-soft" },
    min: NON_TEXT_MIN,
    source: "DesignSystem.tsx Banner (bg-warning-soft [&>svg]:text-warning)",
  },
];

const KNOWN_FAILURES: Array<{
  id: string;
  mode: Mode;
  reason: string;
  ratio: number;
}> = [];

const ADVISORY: Pair[] = [
  {
    id: "surface/input-vs-card",
    label: "nền ô nhập so với nền thẻ chứa nó",
    fg: { token: "surface-3" },
    bg: { token: "surface" },
    min: 0,
    source: "FormControls.tsx (bg-surface-3) đặt trong Card.tsx (bg-surface)",
  },
  {
    id: "surface/panel-vs-page",
    label: "nền surface-2 so với nền trang",
    fg: { token: "surface-2" },
    bg: { token: "canvas" },
    min: 0,
    source: "giao diện phẳng: khối tách nhau bằng nền chứ không bằng viền",
  },
  {
    id: "focus-halo/canvas",
    label: "hào focus mờ (primary 20%) trên nền trang",
    fg: { token: "primary", alpha: 0.2 },
    bg: { token: "canvas" },
    min: 0,
    source: "focus-visible:ring-4 focus-visible:ring-primary/20",
  },
  {
    id: "focus-halo/surface",
    label: "hào focus mờ (primary 20%) trên nền thẻ",
    fg: { token: "primary", alpha: 0.2 },
    bg: { token: "surface" },
    min: 0,
    source: "focus-visible:ring-4 focus-visible:ring-primary/20",
  },
  {
    id: "focus-halo/surface-2",
    label: "hào focus mờ (primary 20%) trên nền surface-2",
    fg: { token: "primary", alpha: 0.2 },
    bg: { token: "surface-2" },
    min: 0,
    source: "focus-visible:ring-4 focus-visible:ring-primary/20",
  },
  {
    id: "focus-halo/surface-3",
    label: "hào focus mờ (primary 20%) trên nền surface-3",
    fg: { token: "primary", alpha: 0.2 },
    bg: { token: "surface-3" },
    min: 0,
    source: "focus-visible:ring-4 focus-visible:ring-primary/20",
  },
];

function resolveColor(tokens: Record<string, string>, ref: ColorRef): Rgb {
  const base =
    "token" in ref
      ? (() => {
          const value = tokens[ref.token];
          if (!value) {
            throw new Error(`Không có token --${ref.token} trong index.css.`);
          }
          return parseColor(value);
        })()
      : parseColor(ref.literal);
  if (ref.alpha === undefined) return base;
  return { ...base, a: ref.alpha };
}

function measure(mode: Mode, pair: Pair): number {
  const tokens = mode === "light" ? LIGHT : DARK;
  const background = resolveColor(tokens, pair.bg);
  const foreground = resolveColor(tokens, pair.fg);
  return contrastRatio(foreground, background);
}

function measureWithAlpha(mode: Mode, pair: Pair): number {
  const tokens = mode === "light" ? LIGHT : DARK;
  const background = resolveColor(tokens, pair.bg);
  let foreground = resolveColor(tokens, pair.fg);
  if (foreground.a < 1) foreground = composite(foreground, background);
  return contrastRatio(foreground, background);
}

function measureKnown(mode: Mode, pair: Pair): number {
  return pair.fg.alpha === undefined
    ? measure(mode, pair)
    : measureWithAlpha(mode, pair);
}

const MODE_LABEL: Record<Mode, string> = {
  light: "sáng",
  dark: "tối",
};

function knownFailure(id: string, mode: Mode) {
  return KNOWN_FAILURES.find(item => item.id === id && item.mode === mode);
}

function measureForStatus(mode: Mode, pair: Pair): number {
  return knownFailure(pair.id, mode) ? measureKnown(mode, pair) : measure(mode, pair);
}

describe("tương phản màu của giao diện phẳng", () => {
  it("đọc được token của cả hai chế độ", () => {
    expect(LIGHT.ink).toBeTruthy();
    expect(LIGHT.canvas).toBeTruthy();
    expect(DARK.ink).toBeTruthy();
    expect(DARK.canvas).toBeTruthy();
    expect(LIGHT.ink).not.toBe(DARK.ink);
  });

  it("mọi cặp đang đạt vẫn phải đạt", () => {
    const failures: string[] = [];
    for (const pair of PAIRS) {
      for (const mode of ["light", "dark"] as Mode[]) {
        if (knownFailure(pair.id, mode)) continue;
        const ratio = measure(mode, pair);
        if (ratio < pair.min) {
          failures.push(
            `${pair.id} (${MODE_LABEL[mode]}): ${ratio.toFixed(2)}:1 < ${pair.min}:1 — ${pair.label}`
          );
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("cặp trong KNOWN_FAILURES vẫn phải chưa đạt (danh sách phải trung thực)", () => {
    const stale: string[] = [];
    for (const entry of KNOWN_FAILURES) {
      const pair = PAIRS.find(item => item.id === entry.id);
      expect(pair, `KNOWN_FAILURES chứa cặp không tồn tại: ${entry.id}`).toBeTruthy();
      if (!pair) continue;
      const ratio = measureKnown(entry.mode, pair);
      if (ratio >= pair.min) {
        stale.push(
          `${entry.id} (${MODE_LABEL[entry.mode]}): đã đạt ${ratio.toFixed(2)}:1 ` +
            `(ngưỡng ${pair.min}:1) — hãy gỡ khỏi KNOWN_FAILURES`
        );
      }
    }
    expect(stale).toEqual([]);
  });

  it("số đo trong KNOWN_FAILURES khớp với palette hiện tại", () => {
    const drift: string[] = [];
    for (const entry of KNOWN_FAILURES) {
      const pair = PAIRS.find(item => item.id === entry.id);
      if (!pair) continue;
      const ratio = measureKnown(entry.mode, pair);
      if (Math.abs(ratio - entry.ratio) > 0.05) {
        drift.push(
          `${entry.id} (${MODE_LABEL[entry.mode]}): ghi ${entry.ratio.toFixed(2)}:1 ` +
            `nhưng đo được ${ratio.toFixed(2)}:1`
        );
      }
    }
    expect(drift).toEqual([]);
  });

  it("mọi cặp trong danh sách đều tồn tại và có lý do", () => {
    for (const entry of KNOWN_FAILURES) {
      expect(
        PAIRS.some(pair => pair.id === entry.id),
        `KNOWN_FAILURES chứa cặp không tồn tại: ${entry.id}`
      ).toBe(true);
      expect(entry.reason.length).toBeGreaterThan(10);
    }
  });

  it("chữ gợi ý dùng token riêng nên đạt chuẩn ở cả hai chế độ", () => {
    const placeholder = PAIRS.find(pair => pair.id === "input/placeholder");
    const pillPlaceholder = PAIRS.find(
      pair => pair.id === "input/pillPlaceholder"
    );
    expect(placeholder).toBeTruthy();
    expect(pillPlaceholder).toBeTruthy();
    if (!placeholder || !pillPlaceholder) return;

    for (const mode of ["light", "dark"] as Mode[]) {
      expect(measure(mode, placeholder)).toBeGreaterThanOrEqual(
        placeholder.min
      );
      expect(measure(mode, pillPlaceholder)).toBeGreaterThanOrEqual(
        pillPlaceholder.min
      );
    }
  });

  it("phép đo chuẩn bỏ qua alpha, phép đo có alpha thì không (C5)", () => {
    const veiled: Pair = {
      id: "demo/veiled",
      label: "màu phủ alpha trên nền ô nhập",
      fg: { token: "muted", alpha: 0.6 },
      bg: { token: "surface-3" },
      min: TEXT_MIN,
      source: "ví dụ minh hoạ cho phép đo alpha",
    };

    expect(measure("light", veiled)).toBeGreaterThanOrEqual(veiled.min);

    expect(measureWithAlpha("light", veiled)).toBeLessThan(veiled.min);
  });

  it("in bảng tương phản đầy đủ", () => {
    const lines: string[] = [];
    const mismatches: string[] = [];
    for (const pair of PAIRS) {
      const light = measureForStatus("light", pair);
      const dark = measureForStatus("dark", pair);
      const mark = (ratio: number) => (ratio >= pair.min ? "dat" : "KHONG-DAT");
      for (const [mode, ratio] of [
        ["light", light],
        ["dark", dark],
      ] as Array<[Mode, number]>) {
        const status = mark(ratio);
        if (status === "dat" && knownFailure(pair.id, mode)) {
          mismatches.push(`${pair.id} (${MODE_LABEL[mode]}): ${ratio.toFixed(2)}:1 nhưng KHONG-DAT`);
        }
      }
      lines.push(
        `${pair.id} | ${pair.label} | ${light.toFixed(2)} | ${dark.toFixed(2)} | ` +
          `${pair.min} | ${mark(light)}/${mark(dark)}`
      );
    }
    console.log(
      `\nBẢNG TƯƠNG PHẢN (id | nhãn | sáng | tối | ngưỡng | trạng thái)\n` +
        `(phép đo chuẩn bỏ qua alpha; mục trong KNOWN_FAILURES dùng phép đo ` +
        `khớp với trạng thái, có alpha khi cần)\n${lines.join("\n")}`
    );
    expect(mismatches).toEqual([]);
    expect(lines.length).toBe(PAIRS.length);
  });

  it("in các cặp chỉ để tham khảo (không làm fail)", () => {
    const measureAdvisory = (mode: Mode, pair: Pair) =>
      pair.fg.alpha === undefined ? measure(mode, pair) : measureWithAlpha(mode, pair);
    const lines = ADVISORY.map(pair => {
      const light = measureAdvisory("light", pair);
      const dark = measureAdvisory("dark", pair);
      return `${pair.id} | ${pair.label} | ${light.toFixed(2)} | ${dark.toFixed(2)}`;
    });
    console.log(
      `\nCẶP THAM KHẢO (id | nhãn | sáng | tối)\n${lines.join("\n")}`
    );
    expect(lines.length).toBe(ADVISORY.length);
  });
});
