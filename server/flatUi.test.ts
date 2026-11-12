import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Regression test: giao diện phẳng, không đổ bóng và không viền bao quanh.
 *
 * Yêu cầu của sản phẩm: bỏ mọi hiệu ứng đổ bóng và viền để các khối tách
 * nhau bằng nền và khoảng cách thay vì bóng đổ và đường viền.
 *
 * Giữ lại: đường kẻ bên trong (`border-b`, `border-t` — đường phân cách nội
 * dung) và viền focus khi điều hướng bằng bàn phím (`ring-*`).
 */

const root = path.resolve(import.meta.dirname, "..");
const clientSrc = path.join(root, "client", "src");

/** Token viền bao quanh: `border` (độ dày) đứng cạnh màu viền. */
const OUTER_BORDER = /(^|\s)border(\s|$)/;

/** Đường kẻ bên trong được phép giữ. */
const INNER_BORDER = /(^|\s)(border-[btrlxyse]|last:border-0)(\s|$)/;

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

  it("không còn viền bao quanh", () => {
    const offenders: string[] = [];
    for (const item of classes) {
      const text = item.text;
      if (!OUTER_BORDER.test(text)) continue;
      // Đường kẻ bên trong không phải viền bao quanh.
      if (INNER_BORDER.test(text)) continue;
      offenders.push(`${item.file}:${item.line}`);
    }
    expect(offenders).toEqual([]);
  });
});
