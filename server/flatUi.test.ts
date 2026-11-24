import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const clientSrc = path.join(root, "client", "src");

const BORDER_CLASS =
  /(^|\s)(border(\s|$)|border-[btrlxyse](\s|$)|last:border-[\w-]+)/;

const DIVIDE_CLASS = /(^|\s)divide-/;

const ARBITRARY_SPACING =
  /(?:^|[\s"'`:])(?:[a-z]{2,8}:)?(?:gap-x|gap-y|space-x|space-y|mx|my|mt|mr|mb|ml|px|py|pt|pr|pb|pl|gap|m|p)-\[/;

const MARGIN_TOP = /(?:^|[\s"'`])(?:[a-z]{2,8}:)?mt-[1-9]\d*(?:\.\d+)?(?=$|[\s"`])/;

const PADDING_TOP = /(?:^|[\s"'`])(?:[a-z]{2,8}:)?pt-[1-9]\d*(?:\.\d+)?(?=$|[\s"`])/;

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, acc);
    else if (/\.tsx?$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

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

  it("không dùng ring làm viền trang trí (ring chỉ cho focus)", () => {
    const offenders: string[] = [];
    for (const item of classes) {
      const decorative = item.text
        .split(/\s+/)
        .some(
          token =>
            /(^|:)ring(-|$)/.test(token) &&
            !/(^|:|-)focus(-visible|-within)?:/.test(token)
        );
      if (decorative) offenders.push(`${item.file}:${item.line}`);
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

  it("giữ chỉ dẫn focus-visible đặc của toàn cục", () => {
    const css = readFileSync(
      path.join(clientSrc, "index.css"),
      "utf8",
    );
    expect(css).toMatch(
      /:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--primary\)/,
    );
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

  it("không vô hiệu hoá outline focus bằng outline-none", () => {
    const offenders: string[] = [];
    for (const item of literals) {
      if (
        /(^|[\s"'`])(?:focus-visible:)?outline-none(?=$|[\s"'`])/.test(item.text)
      ) {
        offenders.push(`${item.file}:${item.line} «${item.text.slice(0, 60)}»`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
