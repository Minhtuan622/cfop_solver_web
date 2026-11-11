import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Regression test cho D5 (ảnh chụp màn hình thật trong README).
 *
 * README trước đây chỉ có khối ảnh comment, nên mọi ảnh trong repo có thể
 * bị xoá mà không ai hay biết. Test này chặn ảnh hỏng: mọi ảnh README
 * tham chiếu tới phải tồn tại, và mọi ảnh có trong docs/screenshots/ phải
 * được tham chiếu.
 */

const root = path.resolve(import.meta.dirname, "..");
const screenshotDir = path.join(root, "docs", "screenshots");

function readReadme(file: string): string {
  return readFileSync(path.join(root, file), "utf8");
}

function referencedScreenshots(readme: string): string[] {
  const matches = readme.matchAll(/!\[[^\]]*\]\((docs\/screenshots\/[^)]+)\)/g);
  return Array.from(matches, match => match[1]);
}

describe("README screenshots", () => {
  it("có ảnh trong docs/screenshots/", () => {
    expect(existsSync(screenshotDir)).toBe(true);
    expect(readdirSync(screenshotDir).filter(file => file.endsWith(".png")).length).toBeGreaterThan(0);
  });

  it("mọi ảnh README.md tham chiếu đều tồn tại", () => {
    const referenced = referencedScreenshots(readReadme("README.md"));
    expect(referenced.length).toBeGreaterThan(0);
    const missing = referenced.filter(image => !existsSync(path.join(root, image)));
    expect(missing).toEqual([]);
  });

  it("mọi ảnh README.en.md tham chiếu đều tồn tại", () => {
    const referenced = referencedScreenshots(readReadme("README.en.md"));
    expect(referenced.length).toBeGreaterThan(0);
    const missing = referenced.filter(image => !existsSync(path.join(root, image)));
    expect(missing).toEqual([]);
  });

  it("không để ảnh nào trong docs/screenshots/ bị bỏ rơi", () => {
    const referenced = new Set([
      ...referencedScreenshots(readReadme("README.md")),
      ...referencedScreenshots(readReadme("README.en.md")),
    ]);
    const orphans = readdirSync(screenshotDir)
      .filter(file => file.endsWith(".png"))
      .filter(file => !referenced.has(`docs/screenshots/${file}`));
    expect(orphans).toEqual([]);
  });

  it("có script sinh lại ảnh", () => {
    expect(existsSync(path.join(root, "scripts", "capture-screenshots.mjs"))).toBe(true);
    const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts?.screenshots).toContain("capture-screenshots.mjs");
  });
});
