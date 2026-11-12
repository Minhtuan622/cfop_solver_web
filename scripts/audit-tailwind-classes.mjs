/**
 * Kiểm kê class nào trong mã nguồn KHÔNG tồn tại trong Tailwind.
 *
 * Cách làm chắc chắn: build production, đọc CSS sinh ra, lấy tập class mà
 * Tailwind thực sự sinh (đã bỏ variant), rồi so với các class dùng trong
 * source. Class nào không có trong CSS là class chết: hoặc sót từ Bootstrap,
 * hoặc sai tên.
 *
 *   pnpm build && node scripts/audit-tailwind-classes.mjs
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { baseName, classNamesOf } from "./lib/class-names.mjs";

const root = path.resolve(import.meta.dirname, "..");
const cssDir = path.join(root, "dist", "public", "assets");

if (!existsSync(cssDir)) {
  console.error(
    `Chưa có CSS đã build tại ${path.relative(root, cssDir)}.\n` +
      "Chạy `pnpm build` trước rồi chạy lại script này."
  );
  process.exit(1);
}

/** Class Tailwind thực sự sinh ra. */
const generated = new Set();
for (const file of readdirSync(cssDir)) {
  if (!file.endsWith(".css")) continue;
  const css = readFileSync(path.join(cssDir, file), "utf8");
  // Class có ký tự đặc biệt được CSS escape: .xl\:col-span-3, .w-\[26rem\]
  for (const match of css.matchAll(/\.((?:\\.|[A-Za-z0-9_-])+)/g)) {
    generated.add(baseName(match[1].replace(/\\(.)/g, "$1")));
  }
}

/** Class do chính dự án định nghĩa trong CSS của nó (không phải Tailwind). */
const custom = new Set();
for (const cssFile of ["client/src/index.css", "client/src/styles/cube.css"]) {
  const css = readFileSync(path.join(root, cssFile), "utf8");
  for (const match of css.matchAll(/\.((?:\\.|[A-Za-z0-9_-])+)/g)) {
    custom.add(baseName(match[1].replace(/\\(.)/g, "$1")));
  }
}

function sourceFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, acc);
    else if (/\.(tsx|ts)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

const usage = new Map();
for (const file of sourceFiles(path.join(root, "client", "src"))) {
  const source = readFileSync(file, "utf8");
  for (const literal of classNamesOf(source)) {
    for (const token of literal.split(/\s+/)) {
      if (!token) continue;
      const name = baseName(token);
      if (!name || /[{}()"'`$=]/.test(name)) continue;
      if (!usage.has(name)) usage.set(name, new Set());
      usage.get(name).add(path.relative(root, file));
    }
  }
}

/** Class sinh động (`cube3d-layer-${face}`) chỉ có tiền tố trong source. */
const dynamic = [...usage.entries()].filter(([name]) => name.endsWith("-"));

const missing = [...usage.entries()]
  .filter(([name]) => !generated.has(name) && !custom.has(name))
  // Class động chỉ được chấp nhận nếu có class nào trong CSS bắt đầu bằng
  // tiền tố đó (ví dụ `cube3d-layer-` -> `.cube3d-layer-r`).
  .filter(([name]) => {
    if (!name.endsWith("-")) return true;
    for (const known of generated) if (known.startsWith(name)) return false;
    for (const known of custom) if (known.startsWith(name)) return false;
    return true;
  })
  .sort((a, b) => a[0].localeCompare(b[0]));

console.log(`class dùng trong source: ${usage.size}`);
console.log(`class Tailwind sinh ra: ${generated.size}`);
console.log(`class custom của dự án: ${custom.size}`);
console.log(`class sinh động (tiền tố): ${dynamic.length}`);
console.log(`\nclass KHÔNG tồn tại (${missing.length}):`);
for (const [name, files] of missing) {
  console.log(`  ${name.padEnd(28)} ${[...files][0]}${files.size > 1 ? ` (+${files.size - 1})` : ""}`);
}
process.exitCode = missing.length > 0 ? 1 : 0;
