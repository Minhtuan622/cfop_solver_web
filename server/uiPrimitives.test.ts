import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Regression test: giao diện phải dùng bộ thành phần dùng chung.
 *
 * Lỗi thật trước đây: mỗi nơi tự viết chuỗi class của nút và của ô nhập.
 * Cùng một kiểu giao diện xuất hiện ở nhiều dạng khác nhau và rất khó kiểm
 * soát — 156 chỗ lặp lại cùng một chuỗi class nút dài.
 *
 * Test này chặn việc viết tay lại: thẻ `button`, `input`, `select`,
 * `textarea` phải dùng primitive, không tự mang chuỗi class chuẩn.
 */

const root = path.resolve(import.meta.dirname, "..");
const clientSrc = path.join(root, "client", "src");

/** Chuỗi class của nút chuẩn trước khi gom — nếu thấy ở thẻ control là đã viết tay. */
const RAW_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full";

/** Chuỗi class của ô nhập chuẩn trước khi gom. */
const RAW_CONTROL_CLASS =
  "rounded-field border border-line bg-surface px-3.5 py-2.5";

/**
 * File được phép mang chuỗi class chuẩn: chính nơi định nghĩa các mẫu nút
 * dùng chung (nhóm nút pill).
 */
const ALLOWED_FILES = new Set([
  "client/src/components/ui/DesignSystem.tsx",
]);

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, acc);
    else if (/\.tsx$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

/** Mọi thẻ control kèm chuỗi class của nó. */
function controlClasses(): { file: string; line: number; tag: string; cls: string }[] {
  const found: { file: string; line: number; tag: string; cls: string }[] = [];
  for (const file of sourceFiles(clientSrc)) {
    const source = readFileSync(file, "utf8");
    const pattern = /<(button|input|select|textarea)\b/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) {
      // className nằm ngay sau thẻ mở, nên đọc một đoạn ngắn phía sau là đủ.
      const segment = source.slice(match.index, match.index + 600);
      const cls = segment.match(/className="([^"]*)"/);
      if (!cls) continue;
      found.push({
        file: path.relative(root, file),
        line: source.slice(0, match.index).split("\n").length,
        tag: match[1],
        cls: cls[1],
      });
    }
  }
  return found;
}

describe("giao diện dùng bộ thành phần dùng chung", () => {
  const controls = controlClasses();

  it("tìm được thẻ control để kiểm tra", () => {
    expect(controls.length).toBeGreaterThan(30);
  });

  it("không còn nút viết tay chuỗi class chuẩn", () => {
    const offenders: string[] = [];
    for (const item of controls) {
      if (item.tag !== "button") continue;
      if (ALLOWED_FILES.has(item.file)) continue;
      if (item.cls.includes(RAW_BUTTON_CLASS)) {
        offenders.push(`${item.file}:${item.line} <button>`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("không còn ô nhập viết tay chuỗi class chuẩn", () => {
    const offenders: string[] = [];
    for (const item of controls) {
      if (item.tag === "button") continue;
      if (ALLOWED_FILES.has(item.file)) continue;
      if (item.cls.includes(RAW_CONTROL_CLASS)) {
        offenders.push(`${item.file}:${item.line} <${item.tag}>`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
