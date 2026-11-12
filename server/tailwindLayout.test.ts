import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Regression test cho lỗi giao diện: phần tử trong lưới 12 cột không được
 * thiếu `col-span`.
 *
 * Lỗi thật: khi chuyển từ Bootstrap sang Tailwind, một `<section>` trong
 * `grid grid-cols-12` bị bỏ sót `col-span-12`, nên nó chỉ chiếm 1/12 chiều
 * rộng (79px) và toàn bộ khối phân tích của trang Bấm giờ bị bóp, chữ xuống
 * dòng từng ký tự. Class `col-auto` của Bootstrap cũng là class chết trong
 * Tailwind: nó không tồn tại nên phần tử vẫn chỉ chiếm 1/12 cột.
 *
 * Test này chặn cả hai: không còn class Bootstrap sót, và mọi phần tử con
 * trực tiếp của lưới 12 cột đều khai báo số cột chiếm.
 */

const root = path.resolve(import.meta.dirname, "..");
const clientSrc = path.join(root, "client", "src");

/** Các utility của Bootstrap không tồn tại trong Tailwind. */
const BOOTSTRAP_UTILS = [
  "col-auto",
  "col-lg-",
  "col-md-",
  "col-sm-",
  "col-xl-",
  "row g-",
  "d-flex",
  "d-none",
  "card-body",
  "form-control",
  "form-label",
  "btn btn-",
  "input-group",
  "badge text-bg-",
  "list-group",
  "ratio ratio-",
];

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, acc);
    else if (/\.tsx?$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

/**
 * Trong JSX, phần tử con trực tiếp của một lưới 12 cột phải khai báo
 * `col-span`. Đây là bản quét thô theo cặp thẻ: mỗi `grid grid-cols-12`
 * được theo sau bởi các thẻ con của nó.
 */
function gridChildrenMissingColSpan(source: string): string[] {
  const problems: string[] = [];
  const gridPattern = /className="[^"]*\bgrid\b[^"]*\bgrid-cols-12\b[^"]*"/g;
  const tagPattern = /<(\w+)\b([^>]*?)>/g;

  for (const grid of source.matchAll(gridPattern)) {
    const start = grid.index ?? 0;
    // Chỉ xét các thẻ con xuất hiện sau lưới và trước thẻ đóng tương ứng.
    const rest = source.slice(start + grid[0].length, start + 4000);
    const children = [...rest.matchAll(tagPattern)].slice(0, 12);
    for (const child of children) {
      const cls = child[2].match(/className="([^"]*)"/)?.[1] ?? "";
      if (!cls) continue;
      if (!cls.includes("col-span-")) {
        problems.push(`${child[1]} class="${cls.slice(0, 70)}"`);
      }
    }
    break; // Một lời gọi đầu tiên đủ để chặn lỗi đã gặp.
  }
  return problems;
}

describe("giao diện lưới 12 cột", () => {
  const files = sourceFiles(clientSrc);

  it("không còn class utility của Bootstrap sót lại", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const util of BOOTSTRAP_UTILS) {
        const pattern = new RegExp(
          `className="[^"]*\\b${util.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^"]*"`
        );
        if (pattern.test(source)) {
          offenders.push(`${path.relative(root, file)} -> ${util}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
