import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { classNamesOf } from "../scripts/lib/class-names.mjs";

/**
 * Regression test: không còn class Bootstrap hay class chết trong giao diện.
 *
 * Lỗi thật: khi chuyển từ Bootstrap sang Tailwind, một số class Bootstrap
 * còn sót lại (`col-auto`, `sticky-xl-top`...). Tailwind không có các class đó
 * nên chúng vô hiệu lặng lẽ: phần tử chỉ chiếm 1/12 cột của lưới, hoặc
 * không bám dính như ý định, mà không có lỗi nào được báo.
 *
 * `scripts/audit-bootstrap-classes.mjs` là công cụ kiểm kê cùng bộ quy tắc.
 */

const root = path.resolve(import.meta.dirname, "..");
const clientSrc = path.join(root, "client", "src");

/** Utility CHỈ có của Bootstrap 5 (những tên trùng với Tailwind không nằm ở đây). */
const BOOTSTRAP_PREFIXES = [
  "row", "row-cols-", "col-", "col-auto", "offset-", "g-", "gx-", "gy-",
  "d-none", "d-block", "d-inline", "d-inline-block", "d-flex", "d-inline-flex",
  "d-grid", "d-table", "d-print-",
  "flex-column", "flex-row-reverse", "flex-column-reverse", "flex-fill",
  "flex-grow-", "flex-shrink-", "justify-content-", "justify-self-",
  "align-items-", "align-content-", "align-self-", "flex-wrap-reverse",
  "display-", "lead", "fs-", "fw-", "fst-", "font-italic", "text-lowercase",
  "text-uppercase", "text-capitalize", "text-decoration-", "text-nowrap",
  "text-break", "text-truncate", "text-reset", "text-hide", "text-justify",
  "h1", "h2", "h3", "h4", "h5", "h6", "small", "mark", "blockquote",
  "rounded-circle", "rounded-pill", "rounded-0", "border-opacity-",
  "btn", "btn-primary", "btn-secondary", "btn-success", "btn-danger",
  "btn-warning", "btn-info", "btn-light", "btn-dark", "btn-link", "btn-outline-",
  "btn-group", "btn-toolbar", "btn-close",
  "card", "card-body", "card-header", "card-footer", "card-title",
  "card-text", "card-subtitle", "card-img", "card-link", "card-group",
  "card-columns",
  "list-group", "badge", "alert", "alert-", "form-", "input-group",
  "table", "nav", "navbar", "dropdown", "modal", "offcanvas", "toast",
  "tooltip", "popover", "accordion", "pagination", "breadcrumb", "spinner",
  "placeholder", "ratio", "progress", "avatar", "overlay", "visually-hidden",
  "float-", "position-", "fixed-top", "fixed-bottom", "sticky-top",
  "translate-middle", "user-select-", "pe-auto", "ms-auto", "me-auto",
  "table-responsive", "embed-responsive", "clearfix", "border-start",
  "border-end", "rounded-start", "rounded-end",
];

const BOOTSTRAP_EXACT = new Set([
  "row", "small", "lead", "mark", "blockquote", "btn", "card", "badge",
  "alert", "form-label", "form-control", "form-select", "form-check",
  "form-switch", "form-range", "form-text", "form-hint", "form-floating",
  "input-group", "input-group-text", "input-group-sm", "list-group",
  "list-group-item", "table", "nav", "navbar", "dropdown", "modal",
  "offcanvas", "toast", "tooltip", "popover", "accordion", "pagination",
  "breadcrumb", "spinner", "placeholder", "ratio", "progress", "avatar",
  "overlay", "visually-hidden", "table-responsive", "embed-responsive",
  "clearfix", "h1", "h2", "h3", "h4", "h5", "h6",
]);

/** Tiền tố Tailwind cũng có, nên không phải class Bootstrap. */
const TAILWIND_PREFIXES = ["col-span-", "col-start-", "col-end-", "leading-", "placeholder"];

/** Class chết đã gặp: không có CSS nào định nghĩa cho chúng. */
const DEAD_CLASSES = [
  "sticky-xl-top",
  "cube3d-guide",
  "cube3d-phase-callout",
  "cube-net--studio",
];

/**
 * Tiền tố class do chính dự án quản lý (không phải utility Tailwind).
 * Mọi class tĩnh trong nhóm này phải có trong CSS của dự án.
 */
const PROJECT_CLASS_PREFIXES = ["cube-net", "cube3d", "interactive-cube-stage", "is-orbiting"];

function isBootstrapClass(token: string): boolean {
  if (TAILWIND_PREFIXES.some(prefix => token.startsWith(prefix))) return false;
  if (BOOTSTRAP_EXACT.has(token)) return true;
  return BOOTSTRAP_PREFIXES.some(prefix => token === prefix || token.startsWith(prefix));
}

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, acc);
    else if (/\.tsx?$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

/**
 * Mọi class được dùng trong các thuộc tính `className` của source.
 *
 * Dùng chung bộ quét với `scripts/audit-bootstrap-classes.mjs` để không bỏ
 * sót class nằm trong `cn(...)` hay template literal.
 */
function usedClasses(): Map<string, Set<string>> {
  const usage = new Map<string, Set<string>>();
  for (const file of sourceFiles(clientSrc)) {
    const source = readFileSync(file, "utf8");
    for (const literal of classNamesOf(source)) {
      for (const token of literal.split(/\s+/)) {
        if (!token || token.includes("[") || token.includes("(")) continue;
        if (!usage.has(token)) usage.set(token, new Set());
        usage.get(token)!.add(path.relative(root, file));
      }
    }
  }
  return usage;
}

/**
 * Tìm vị trí kết thúc của một thẻ JSX bắt đầu tại `start`.
 *
 * `>` có thể nằm trong biểu thức JSX (`onChange={e => ...}`) hoặc trong
 * chuỗi, nên không thể dừng ở `>` đầu tiên.
 */
function findTagEnd(source: string, start: number): number {
  let i = start + 1;
  let brace = 0;
  while (i < source.length) {
    const char = source[i];
    if (char === "{") {
      brace += 1;
      i += 1;
      continue;
    }
    if (char === "}") {
      brace -= 1;
      i += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      const quote = char;
      i += 1;
      while (i < source.length && source[i] !== quote) {
        if (source[i] === "\\") i += 1;
        i += 1;
      }
      i += 1;
      continue;
    }
    if (char === ">" && brace === 0) return i;
    i += 1;
  }
  return -1;
}

/**
 * Quét thẻ JSX, trả về các thẻ **con trực tiếp** của phần tử chứa lớp
 * `grid-cols-12` (không kèm variant) đầu tiên trong file.
 *
 * Bản quét theo độ sâu thẻ: mỗi thẻ mở tăng độ sâu, mỗi thẻ đóng giảm.
 * Thẻ xuất hiện khi độ sâu còn 0 (tức đang ở cấp con trực tiếp) là con
 * trực tiếp của lưới.
 *
 * `md:grid-cols-12` không phải lưới 12 cột ở mọi kích thước: nó chỉ chia
 * 12 cột từ `md` trở lên, nên không được tính vào đây.
 */
function directChildrenOfFirstGrid(source: string): { tag: string; cls: string }[] {
  // Tìm className có token `grid-cols-12` không kèm variant.
  let gridStart = -1;
  for (const match of source.matchAll(/className="([^"]*)"/g)) {
    const tokens = (match[1] ?? "").split(/\s+/);
    if (!tokens.includes("grid-cols-12")) continue;
    gridStart = source.lastIndexOf("<", match.index);
    break;
  }
  if (gridStart < 0) return [];
  const tagEnd = findTagEnd(source, gridStart);
  if (tagEnd < 0) return [];

  const children: { tag: string; cls: string }[] = [];
  let depth = 0;
  let i = tagEnd + 1;

  while (i < source.length) {
    if (source[i] !== "<") {
      i += 1;
      continue;
    }
    // Fragment mở `<>`: tăng độ sâu.
    if (source[i + 1] === ">") {
      depth += 1;
      i += 2;
      continue;
    }
    // Fragment đóng `</>`: giảm độ sâu.
    if (source[i + 1] === "/" && source[i + 2] === ">") {
      depth -= 1;
      if (depth < 0) break;
      i += 3;
      continue;
    }
    // Thẻ đóng thường.
    if (source[i + 1] === "/") {
      depth -= 1;
      if (depth < 0) break;
      const end = findTagEnd(source, i);
      if (end < 0) break;
      i = end + 1;
      continue;
    }
    // Không phải thẻ (ví dụ phép so sánh `a < b`): bỏ qua.
    if (!/[A-Za-z]/.test(source[i + 1] ?? "")) {
      i += 1;
      continue;
    }
    const end = findTagEnd(source, i);
    if (end < 0) break;
    const raw = source.slice(i, end + 1);
    const selfClosing = raw.endsWith("/>");
    const name = /^<([A-Za-z][\w.]*)/.exec(raw)?.[1] ?? "";
    // Sau tên thẻ phải là khoảng trắng, `>` hoặc `/` thì mới là thẻ hợp lệ.
    const afterName = raw.slice(1 + name.length);
    if (!/^[\s/>]/.test(afterName)) {
      i = end + 1;
      continue;
    }
    const cls = raw.match(/className="([^"]*)"/)?.[1] ?? "";
    if (depth === 0) children.push({ tag: name, cls });
    if (!selfClosing) depth += 1;
    i = end + 1;
  }
  return children;
}

describe("giao diện dùng Tailwind, không còn class Bootstrap", () => {
  const usage = usedClasses();

  it("tìm được class trong source để kiểm tra", () => {
    expect(usage.size).toBeGreaterThan(100);
  });

  it("không còn class của Bootstrap sót lại", () => {
    const offenders: string[] = [];
    for (const [name, files] of usage) {
      if (isBootstrapClass(name)) offenders.push(`${name} (${[...files][0]})`);
    }
    expect(offenders).toEqual([]);
  });

  it("không còn class chết đã biết", () => {
    const offenders: string[] = [];
    for (const [name, files] of usage) {
      if (DEAD_CLASSES.includes(name)) offenders.push(`${name} (${[...files][0]})`);
    }
    expect(offenders).toEqual([]);
  });

  it("không dùng cỡ chữ theo vùng nhìn (vw) cho số đo", () => {
    // `vw` không biết vùng chứa: đặt trong một cột hẹp thì chữ tràn ra
    // ngoài khối. Dùng container query (`cqw`) cho số đo theo vùng chứa.
    const offenders: string[] = [];
    for (const [name, files] of usage) {
      if (/\dvw\b/.test(name) && !name.includes("cqw")) {
        offenders.push(`${name} (${[...files][0]})`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("mọi class của dự án đều có trong CSS của dự án", () => {
    // Lỗi thật: `cube-net--studio` còn trong JSX nhưng CSS của nó bị gỡ
    // khi chuyển khỏi Bootstrap, nên class âm thầm không có tác dụng gì.
    const css = ["client/src/index.css", "client/src/styles/cube.css"]
      .map(file => readFileSync(path.join(root, file), "utf8"))
      .join("\n");
    const defined = new Set<string>();
    for (const match of css.matchAll(/\.((?:\\.|[A-Za-z0-9_-])+)/g)) {
      defined.add(match[1].replace(/\\(.)/g, "$1"));
    }

    const offenders: string[] = [];
    for (const [name, files] of usage) {
      // Class sinh động (`cube3d-layer-${face}`) chỉ có tiền tố trong source.
      if (name.endsWith("-")) continue;
      if (!PROJECT_CLASS_PREFIXES.some(prefix => name === prefix || name.startsWith(prefix))) continue;
      if (!defined.has(name)) offenders.push(`${name} (${[...files][0]})`);
    }
    expect(offenders).toEqual([]);
  });

  it("mọi phần tử trong lưới 12 cột đều khai báo số cột chiếm", () => {
    // Lỗi thật: một `<section>` trong `grid grid-cols-12` bị bỏ sót
    // `col-span-12`, nên nó chỉ chiếm 1/12 chiều rộng và khối phân tích của
    // trang Bấm giờ bị bóp, chữ xuống dòng từng ký tự.
    //
    // Phải có `col-span-N` **không kèm variant**: `xl:col-span-8` một mình
    // vẫn để phần tử chiếm 1 cột ở mọi kích thước nhỏ hơn `xl`.
    const offenders: string[] = [];
    for (const file of sourceFiles(clientSrc)) {
      const source = readFileSync(file, "utf8");
      for (const child of directChildrenOfFirstGrid(source)) {
        if (!child.cls) continue;
        const hasBaseSpan = child.cls.split(/\s+/).some(token => /^col-span-\d+$/.test(token));
        if (!hasBaseSpan) {
          offenders.push(`${path.relative(root, file)} -> <${child.tag}> class="${child.cls.slice(0, 70)}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
