/**
 * Kiểm kê class Bootstrap còn sót trong mã nguồn.
 *
 * Tailwind không có các class này nên chúng vô hiệu lặng lẽ: phần tử không
 * được bố cục như ý định mà không báo lỗi. Danh sách dưới đây là các
 * utility CHỈ có của Bootstrap 5 (những tên trùng với Tailwind như
 * `gap-3`, `text-left`, `rounded-full` không nằm trong danh sách).
 *
 *   node scripts/audit-bootstrap-classes.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { classNamesOf } from "./lib/class-names.mjs";

const root = path.resolve(import.meta.dirname, "..");

/** Tiền tố của utility Bootstrap (khớp theo tên đầy đủ hoặc có hậu tố số). */
const BOOTSTRAP_PREFIXES = [
  // bố cục
  "row", "row-cols-", "col-", "col-auto", "offset-", "g-", "gx-", "gy-",
  // hiển thị
  "d-none", "d-block", "d-inline", "d-inline-block", "d-flex", "d-inline-flex",
  "d-grid", "d-table", "d-print-",
  // flex
  "flex-column", "flex-row-reverse", "flex-column-reverse", "flex-fill",
  "flex-grow-", "flex-shrink-", "justify-content-", "justify-self-",
  "align-items-", "align-content-", "align-self-", "flex-wrap-reverse",
  // chữ
  "display-", "lead", "fs-", "fw-", "fst-", "font-italic", "text-lowercase",
  "text-uppercase", "text-capitalize", "text-decoration-", "text-nowrap",
  "text-break", "text-truncate", "text-reset", "text-hide",
  "text-justify",
  "h1", "h2", "h3", "h4", "h5", "h6", "small", "mark", "blockquote",
  // bo góc / viền
  "rounded-circle", "rounded-pill", "rounded-0", "border-opacity-",
  // thành phần
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
  "border-end", "rounded-start", "rounded-end", "text-decoration-none",
];

/** Các tên đầy đủ cần khớp chính xác (không phải tiền tố). */
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

/**
 * Các tiền tố Tailwind cũng có, nên không phải class Bootstrap.
 * Ví dụ `col-span-4`, `leading-none`, `placeholder:text-muted/60`.
 */
const TAILWIND_PREFIXES = ["col-span-", "col-start-", "col-end-", "leading-", "placeholder"];

function isBootstrapClass(token) {
  if (TAILWIND_PREFIXES.some(prefix => token.startsWith(prefix))) return false;
  if (BOOTSTRAP_EXACT.has(token)) return true;
  return BOOTSTRAP_PREFIXES.some(prefix => token === prefix || token.startsWith(prefix));
}

function sourceFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, acc);
    else if (/\.(tsx|ts)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

const hits = new Map();
for (const file of sourceFiles(path.join(root, "client", "src"))) {
  const source = readFileSync(file, "utf8");
  for (const literal of classNamesOf(source)) {
    for (const token of literal.split(/\s+/)) {
      if (!token || token.includes("[") || token.includes("(")) continue;
      if (!isBootstrapClass(token)) continue;
      if (!hits.has(token)) hits.set(token, new Set());
      hits.get(token).add(path.relative(root, file));
    }
  }
}

console.log(`class Bootstrap còn sót: ${hits.size}`);
for (const [name, files] of [...hits.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`  ${name.padEnd(24)} ${[...files][0]}${files.size > 1 ? ` (+${files.size - 1})` : ""}`);
}
process.exitCode = hits.size > 0 ? 1 : 0;
