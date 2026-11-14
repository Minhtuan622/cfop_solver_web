import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Kiểm tra tự động tương phản màu cho giao diện phẳng.
 *
 * Giao diện đã bỏ mọi đường viền và đổ bóng (`server/flatUi.test.ts`), nên
 * màu là tín hiệu duy nhất còn lại để phân biệt chữ với nền, nút với nền và
 * trạng thái với nhau. Bài này tính tỉ lệ tương phản WCAG 2.x giữa các cặp
 * màu chính ở **cả hai** chế độ sáng và tối, đọc token trực tiếp từ
 * `client/src/index.css`.
 *
 * Ngưỡng theo WCAG 2.x:
 * - 4.5:1 cho chữ (WCAG 1.4.3 Contrast (Minimum));
 * - 3:1 cho vòng focus và biểu tượng trạng thái (WCAG 1.4.11
 *   Non-text Contrast).
 *
 * Bài này **không đổi màu**. Cặp đang không đạt nằm trong `KNOWN_FAILURES`
 * kèm lý do và số đo hiện tại; CI vẫn xanh. Ngược lại, nếu một cặp trong
 * `KNOWN_FAILURES` đã đạt mà chưa được gỡ khỏi danh sách thì bài này FAIL —
 * danh sách phải luôn trung thực với palette hiện tại.
 *
 * Báo cáo đầy đủ (bảng số đo): `docs/validation/contrast-report.md`.
 */

const root = path.resolve(import.meta.dirname, "..");
const css = readFileSync(path.join(root, "client", "src", "index.css"), "utf8");

/* ------------------------------------------------------------------ *
 * 1. Đọc token màu từ CSS
 * ------------------------------------------------------------------ */

/** Màu ở dạng sRGB với alpha 0..1. */
type Rgb = { r: number; g: number; b: number; a: number };

/**
 * Quy đổi một giá trị màu trong CSS sang sRGB.
 *
 * Hỗ trợ `#rgb`, `#rrggbb`, `rgb(r, g, b)` và `rgba(r, g, b, a)` — đó là
 * đúng những định dạng đang dùng trong `client/src/index.css`.
 */
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

/** Phủ màu có alpha lên một nền đục (theo alpha compositing của trình duyệt). */
function composite(foreground: Rgb, background: Rgb): Rgb {
  const alpha = foreground.a;
  return {
    r: foreground.r * alpha + background.r * (1 - alpha),
    g: foreground.g * alpha + background.g * (1 - alpha),
    b: foreground.b * alpha + background.b * (1 - alpha),
    a: 1,
  };
}

/** Độ chói tương đối theo WCAG 2.x. */
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

/** Tỉ lệ tương phản WCAG 2.x giữa hai màu đục. */
function contrastRatio(a: Rgb, b: Rgb): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Lấy các biến `--token: giá trị;` của một khối selector trong CSS.
 *
 * Chỉ đọc file, không cần trình duyệt: token nằm ngay trong
 * `client/src/index.css`.
 */
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

/* ------------------------------------------------------------------ *
 * 2. Danh sách cặp màu
 * ------------------------------------------------------------------ */

/** Tham chiếu một màu: token trong `index.css` hoặc một màu viết tay. */
type ColorRef = { token: string; alpha?: number } | { literal: string };

type Mode = "light" | "dark";

type Pair = {
  /** Định danh duy nhất, dùng trong KNOWN_FAILURES. */
  id: string;
  /** Mô tả tiếng Việt để báo cáo lỗi cho người đọc. */
  label: string;
  fg: ColorRef;
  bg: ColorRef;
  /** Ngưỡng tối thiểu theo WCAG 2.x. */
  min: number;
  /** Nơi cặp màu này xuất hiện trong mã nguồn. */
  source: string;
};

/** Ngưỡng cho chữ (WCAG 1.4.3). */
const TEXT_MIN = 4.5;
/** Ngưỡng cho vòng focus và biểu tượng trạng thái (WCAG 1.4.11). */
const NON_TEXT_MIN = 3;

const PAIRS: Pair[] = [
  /* Chữ chính và chữ phụ trên các nền. */
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

  /* Nhãn chữ trên nút — mọi biến thể trong Button.tsx. */
  {
    id: "button/primary",
    label: "nút chính — chữ trắng trên nền tím",
    fg: { literal: "#ffffff" },
    bg: { token: "primary" },
    min: TEXT_MIN,
    source: "Button.tsx variant primary (bg-primary text-white)",
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
    label: "nút dangerSolid — chữ trắng trên nền đỏ",
    fg: { literal: "#ffffff" },
    bg: { token: "danger" },
    min: TEXT_MIN,
    source: "Button.tsx variant dangerSolid (bg-danger text-white)",
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
    label: "nút successSolid — chữ trắng trên nền xanh",
    fg: { literal: "#ffffff" },
    bg: { token: "success" },
    min: TEXT_MIN,
    source: "bg-success text-white (Rooms.tsx, TimerLab.tsx, Profile.tsx)",
  },
  {
    id: "button/warning",
    label: "nút warning — chữ chính trên nền hổ phách",
    fg: { token: "ink" },
    bg: { token: "warning" },
    min: TEXT_MIN,
    source: "Button.tsx variant warning (bg-warning text-ink)",
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

  /* Nhãn trên nền tô màu. */
  {
    id: "chip/primary",
    label: "nhãn tím trên nền primary-soft",
    fg: { token: "primary" },
    bg: { token: "primary-soft" },
    min: TEXT_MIN,
    source: "DesignSystem.tsx IconBox / EyebrowPill (bg-primary-soft text-primary)",
  },
  {
    id: "chip/accent",
    label: "nhãn accent trên nền accent-soft",
    fg: { token: "accent" },
    bg: { token: "accent-soft" },
    min: TEXT_MIN,
    source: "token --accent / --accent-soft (chưa dùng cho chữ nào trong UI)",
  },

  /* Ô nhập. */
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
    fg: { token: "muted", alpha: 0.6 },
    bg: { token: "surface-3" },
    min: TEXT_MIN,
    source: "FormControls.tsx controlBase (placeholder:text-muted/60)",
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
    fg: { token: "muted", alpha: 0.6 },
    bg: { token: "surface-2" },
    min: TEXT_MIN,
    source: "DesignSystem.tsx PillInput (placeholder:text-muted/60)",
  },

  /* Vòng focus: `:focus-visible { outline: 2px solid var(--primary) }`. */
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

  /* Biểu tượng trạng thái trên nền tô màu. */
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

/**
 * Cặp đang KHÔNG đạt ngưỡng.
 *
 * Bài kiểm tra **không được tự sửa màu** (màu sản phẩm là quyết định của
 * chủ sản phẩm). Mỗi mục ghi lý do và số đo hiện tại; xem đầy đủ ở
 * `docs/validation/contrast-report.md`.
 *
 * Khi palette được sửa và một cặp ở đây đã đạt, phải **xoá mục tương ứng**
 * khỏi danh sách — bài kiểm tra sẽ FAIL nếu quên.
 */
const KNOWN_FAILURES: Array<{
  id: string;
  mode: Mode;
  reason: string;
  /** Số đo hiện tại, làm tròn 2 chữ số — cập nhật khi palette đổi. */
  ratio: number;
}> = [
  {
    id: "button/danger@canvas",
    mode: "light",
    ratio: 4.32,
    reason:
      "Nút danger nền trong suốt (chữ đỏ trên nền trang) chỉ đạt 4.32:1, " +
      "thiếu 0.18:1. Giữ nguyên màu — chủ sản phẩm quyết định.",
  },
  {
    id: "button/success",
    mode: "light",
    ratio: 3.38,
    reason:
      "Nút success nền trong suốt: chữ xanh #0f9f6e trên nền thẻ chỉ đạt " +
      "3.38:1. Màu --success còn dùng cho badge nền xanh nên không thể đổi " +
      "đơn lẻ mà không phá chỗ khác.",
  },
  {
    id: "button/success@canvas",
    mode: "light",
    ratio: 3.11,
    reason: "Cùng lý do với button/success, nền trang thay cho nền thẻ.",
  },
  {
    id: "button/successSolid",
    mode: "light",
    ratio: 3.38,
    reason:
      "Nút xanh đặc (bg-success text-white) chỉ đạt 3.38:1 vì chữ trắng " +
      "trên #0f9f6e. Cần nền đậm hơn cho chữ trắng.",
  },
  {
    id: "chip/accent",
    mode: "light",
    ratio: 3.37,
    reason:
      "Token --accent #0891b2 trên --accent-soft chỉ đạt 3.37:1. Hiện chưa " +
      "dùng cho chữ nào trong UI nên giữ để theo dõi trước khi dùng.",
  },
  {
    id: "input/placeholder",
    mode: "light",
    ratio: 2.34,
    reason:
      "Chữ gợi ý dùng muted/60 trên nền surface-3 chỉ đạt 2.34:1. Cần " +
      "bỏ hết độ trong suốt hoặc đậm hơn.",
  },
  {
    id: "input/pillPlaceholder",
    mode: "light",
    ratio: 2.41,
    reason: "Cùng lý do với input/placeholder, nền surface-2 thay cho surface-3.",
  },
  {
    id: "icon/warning",
    mode: "light",
    ratio: 2.97,
    reason:
      "Biểu tượng hổ phách trên nền warning-soft đạt 2.97:1, thiếu 0.03:1 " +
      "so với ngưỡng 3:1 cho phần tử không phải chữ.",
  },
  {
    id: "button/primary",
    mode: "dark",
    ratio: 3.14,
    reason:
      "Nút chính ở chế độ tối: chữ trắng trên --primary #8585f6 chỉ đạt " +
      "3.14:1. Đây chính là lỗi 'chữ trên nền tím' đã từng được sửa ở chế " +
      "độ sáng nhưng chế độ tối vẫn chưa đạt.",
  },
  {
    id: "button/dangerSolid",
    mode: "dark",
    ratio: 2.69,
    reason:
      "Nút đỏ đặc ở chế độ tối: chữ trắng trên --danger #fb7185 chỉ đạt " +
      "2.69:1.",
  },
  {
    id: "button/successSolid",
    mode: "dark",
    ratio: 1.92,
    reason:
      "Nút xanh đặc ở chế độ tối: chữ trắng trên --success #34d399 chỉ đạt " +
      "1.92:1 — thấp nhất trong toàn bộ bảng.",
  },
  {
    id: "button/warning",
    mode: "dark",
    ratio: 1.43,
    reason:
      "Nút hổ phách ở chế độ tối: chữ chính #e9edf9 trên --warning #fbbf24 " +
      "chỉ đạt 1.43:1.",
  },
  {
    id: "input/placeholder",
    mode: "dark",
    ratio: 3.02,
    reason:
      "Chữ gợi ý ở chế độ tối (muted/60 trên surface-3) đạt 3.02:1, thiếu " +
      "1.48:1 so với ngưỡng 4.5:1 cho chữ.",
  },
  {
    id: "input/pillPlaceholder",
    mode: "dark",
    ratio: 3.24,
    reason:
      "Cùng lý do với input/placeholder ở chế độ tối, nền surface-2 thay " +
      "cho surface-3.",
  },
];

/**
 * Cặp chỉ để **in ra**, không làm test fail.
 *
 * Giao diện đã bỏ đường viền nên ranh giới giữa các khối chỉ còn nhờ nền;
 * tỉ lệ rất thấp ở đây là hệ quả của thiết kế phẳng, không phải lỗi.
 * Chủ sản phẩm cần số liệu này để quyết định.
 */
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

/* ------------------------------------------------------------------ *
 * 3. Đo
 * ------------------------------------------------------------------ */

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

/** Đo tỉ lệ tương phản của một cặp ở một chế độ. */
function measure(mode: Mode, pair: Pair): number {
  const tokens = mode === "light" ? LIGHT : DARK;
  const background = resolveColor(tokens, pair.bg);
  let foreground = resolveColor(tokens, pair.fg);
  if (foreground.a < 1) foreground = composite(foreground, background);
  return contrastRatio(foreground, background);
}

const MODE_LABEL: Record<Mode, string> = {
  light: "sáng",
  dark: "tối",
};

function knownFailure(id: string, mode: Mode) {
  return KNOWN_FAILURES.find(item => item.id === id && item.mode === mode);
}

/* ------------------------------------------------------------------ *
 * 4. Test
 * ------------------------------------------------------------------ */

describe("tương phản màu của giao diện phẳng", () => {
  it("đọc được token của cả hai chế độ", () => {
    expect(LIGHT.ink).toBeTruthy();
    expect(LIGHT.canvas).toBeTruthy();
    expect(DARK.ink).toBeTruthy();
    expect(DARK.canvas).toBeTruthy();
    // Không được trộn hai chế độ: giá trị phải khác nhau.
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
      const ratio = measure(entry.mode, pair);
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
      const ratio = measure(entry.mode, pair);
      // Sai số 0.05 để không vỡ khi palette chỉ nhích vài đơn vị màu.
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

  it("in bảng tương phản đầy đủ", () => {
    const lines: string[] = [];
    for (const pair of PAIRS) {
      const light = measure("light", pair);
      const dark = measure("dark", pair);
      const mark = (ratio: number, mode: Mode) => {
        const known = knownFailure(pair.id, mode);
        if (known) return "KHONG-DAT";
        return ratio >= pair.min ? "dat" : "KHONG-DAT";
      };
      lines.push(
        `${pair.id} | ${pair.label} | ${light.toFixed(2)} | ${dark.toFixed(2)} | ` +
          `${pair.min} | ${mark(light, "light")}/${mark(dark, "dark")}`
      );
    }
    console.log(
      `\nBẢNG TƯƠNG PHẢN (id | nhãn | sáng | tối | ngưỡng | trạng thái)\n${lines.join("\n")}`
    );
    expect(lines.length).toBe(PAIRS.length);
  });

  it("in các cặp chỉ để tham khảo (không làm fail)", () => {
    const lines = ADVISORY.map(pair => {
      const light = measure("light", pair);
      const dark = measure("dark", pair);
      return `${pair.id} | ${pair.label} | ${light.toFixed(2)} | ${dark.toFixed(2)}`;
    });
    console.log(
      `\nCẶP THAM KHẢO (id | nhãn | sáng | tối)\n${lines.join("\n")}`
    );
    expect(lines.length).toBe(ADVISORY.length);
  });
});
