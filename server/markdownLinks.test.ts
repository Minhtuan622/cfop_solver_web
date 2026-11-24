import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "coverage", "test-results"]);

const REMOVED_FEATURES = ["Practice Lab", "PDF Evidence"];

function markdownFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) markdownFiles(full, acc);
    else if (entry.name.endsWith(".md")) acc.push(full);
  }
  return acc;
}

function stripCodeBlocks(source: string): string {
  return source.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
}

function relativeLinks(source: string): string[] {
  const links: string[] = [];
  const pattern = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of stripCodeBlocks(source).matchAll(pattern)) {
    const target = match[1];
    if (/^(https?:|mailto:|tel:|#)/.test(target)) continue;
    links.push(target);
  }
  return links;
}

const files = markdownFiles(root);

describe("liên kết trong tài liệu", () => {
  it("tìm thấy tài liệu để kiểm tra", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("mọi liên kết tương đối đều trỏ tới file thật", () => {
    const broken: string[] = [];
    for (const file of files) {
      for (const target of relativeLinks(readFileSync(file, "utf8"))) {
        const clean = target.split("#")[0].split("?")[0];
        if (!clean) continue;
        const resolved = path.resolve(path.dirname(file), decodeURIComponent(clean));
        if (!existsSync(resolved)) {
          broken.push(`${path.relative(root, file)} -> ${target}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it("tài liệu không nhắc tới tính năng đã bị gỡ", () => {
    const offenders: string[] = [];
    for (const file of files) {
      if (path.relative(root, file).startsWith(path.join("docs", "archive"))) continue;
      const source = readFileSync(file, "utf8");
      for (const feature of REMOVED_FEATURES) {
        if (source.toLowerCase().includes(feature.toLowerCase())) {
          offenders.push(`${path.relative(root, file)} -> ${feature}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("chỉ còn một danh sách việc còn mở", () => {
    const openLists = files.filter(file => {
      const relative = path.relative(root, file);
      if (relative.startsWith(path.join("docs", "archive"))) return false;
      return relative === "TODO.md";
    });
    expect(openLists).toEqual([path.join(root, "TODO.md")]);
  });
});
