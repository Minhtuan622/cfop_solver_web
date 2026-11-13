import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Regression test: giao diện phẳng — không đổ bóng và không có bất kỳ đường
 * viền nào (cả viền bao quanh lẫn đường kẻ phân cách bên trong).
 *
 * Yêu cầu của sản phẩm: các khối tách nhau chỉ bằng nền và khoảng cách.
 * Đường viền duy nhất được giữ lại là vòng focus bàn phím (`ring-*`) — chỉ
 * dẫn tiếp cận — và viền sticker trong `cube.css` (hình học của khối Rubik,
 * không nằm trong phạm vi quét class TSX ở dưới).
 *
 * Cùng tinh thần đó, khoảng cách giữa các khối chỉ dùng scale Tailwind
 * (`gap-4`, `py-3`…) — không "gán cứng" bằng giá trị tuỳ ý (`px-[37px]`) —
 * và một khối không được vừa có margin-top vừa có padding-top (đệm đôi,
 * từng là chỗ trống cho đường kẻ đã bị xoá).
 */

const root = path.resolve(import.meta.dirname, "..");
const clientSrc = path.join(root, "client", "src");

/**
 * Mọi dạng viền bằng class `border*`:
 * - `border` (độ dày cả 4 cạnh)
 * - `border-b`, `border-t`, `border-l`, `border-r`, `border-x`, `border-y`,
 *   `border-s`, `border-e` (đường kẻ một cạnh)
 * - `last:border-0` và các biến thể `last:border-*`
 */
const BORDER_CLASS =
  /(^|\s)(border(\s|$)|border-[btrlxyse](\s|$)|last:border-[\w-]+)/;

/** Mọi đường kẻ phân cách sinh bằng `divide-*`. */
const DIVIDE_CLASS = /(^|\s)divide-/;

/**
 * Khoảng cách "gán cứng" bằng giá trị tuỳ ý: `mt-[10px]`, `gap-[4px]`,
 * `px-[37px]`… Kích thước (`w-[34rem]`, `text-[11px]`) không thuộc nhóm này.
 */
const ARBITRARY_SPACING =
  /(?:^|[\s"'`:])(?:[a-z]{2,8}:)?(?:gap-x|gap-y|space-x|space-y|mx|my|mt|mr|mb|ml|px|py|pt|pr|pb|pl|gap|m|p)-\[/;

/** Một token margin-top khác 0 (`mt-4`, `sm:mt-3`…). */
const MARGIN_TOP = /(?:^|[\s"'`])(?:[a-z]{2,8}:)?mt-[1-9]\d*(?:\.\d+)?(?=$|[\s"`])/;

/** Một token padding-top khác 0 (`pt-4`, `xl:pt-3`…). */
const PADDING_TOP = /(?:^|[\s"'`])(?:[a-z]{2,8}:)?pt-[1-9]\d*(?:\.\d+)?(?=$|[\s"`])/;

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, acc);
    else if (/\.tsx?$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

/** Mọi chuỗi class dùng trong thuộc tính `className`. */
function classStrings(): { file: string; line: number; text: string }[] {
  const found: { file: string; line: number; text: string }[] = [];
  for (const file of sourceFiles(clientSrc)) {
    const source = readFileSync(file, "utf8");
    const pattern = /className=(?:"([^"]*)"|\{`([^`]*)`\})/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) {
      found.push({
        file: path.relative(root, file),
        line: source.slice(0, match.index).split("\n").length,
        text: match[1] ?? match[2] ?? "",
      });
    }
  }
  return found;
}

/**
 * Mọi chuỗi literals trong TSX/TS của client (kể cả class nằm trong `cn(…)`
 * hoặc ternary — dạng `className={cn("…", x ? "mt-4" : "…")}` thoát khỏi
 * phép quét `className=` bên trên).
 */
function stringLiterals(): { file: string; line: number; text: string }[] {
  const found: { file: string; line: number; text: string }[] = [];
  for (const file of sourceFiles(clientSrc)) {
    const source = readFileSync(file, "utf8");
    const pattern = /"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) {
      found.push({
        file: path.relative(root, file),
        line: source.slice(0, match.index).split("\n").length,
        text: match[1] ?? match[2] ?? match[3] ?? "",
      });
    }
  }
  return found;
}

describe("giao diện phẳng", () => {
  const classes = classStrings();

  it("tìm được chuỗi class để kiểm tra", () => {
    expect(classes.length).toBeGreaterThan(100);
  });

  it("không còn hiệu ứng đổ bóng", () => {
    const offenders: string[] = [];
    for (const item of classes) {
      if (/\bshadow-/.test(item.text)) offenders.push(`${item.file}:${item.line}`);
    }
    expect(offenders).toEqual([]);
  });

  it("không còn bất kỳ đường viền nào", () => {
    const offenders: string[] = [];
    for (const item of classes) {
      if (BORDER_CLASS.test(item.text) || DIVIDE_CLASS.test(item.text)) {
        offenders.push(`${item.file}:${item.line}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("toast của sonner không vẽ đường viền", () => {
    const css = readFileSync(
      path.join(clientSrc, "index.css"),
      "utf8",
    );
    expect(css).toMatch(/--normal-border:\s*transparent/);
    expect(css).toMatch(/--normal-border-hover:\s*transparent/);
  });
});

describe("khoảng cách theo scale, không đệm đôi", () => {
  const literals = stringLiterals();

  it("tìm được chuỗi để kiểm tra", () => {
    expect(literals.length).toBeGreaterThan(100);
  });

  it("không gán cứng khoảng cách bằng giá trị tuỳ ý", () => {
    const offenders: string[] = [];
    for (const item of literals) {
      if (ARBITRARY_SPACING.test(item.text)) {
        offenders.push(`${item.file}:${item.line} «${item.text.slice(0, 60)}»`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("một khối không vừa có margin-top vừa có padding-top (đệm đôi)", () => {
    const offenders: string[] = [];
    for (const item of literals) {
      if (MARGIN_TOP.test(item.text) && PADDING_TOP.test(item.text)) {
        offenders.push(`${item.file}:${item.line} «${item.text.slice(0, 60)}»`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
