import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { SURFACE_TOKENS } from "../client/src/lib/colorScale";
import { COLOR_PRESETS } from "../client/src/lib/themeColors";

const root = path.resolve(import.meta.dirname, "..");
const css = readFileSync(path.join(root, "client", "src", "index.css"), "utf8");

function block(selector: RegExp): Record<string, string> {
  const match = selector.exec(css);
  if (!match) throw new Error("Không tìm thấy khối CSS.");
  const open = css.indexOf("{", match.index);
  const body = css.slice(open + 1, css.indexOf("}", open));
  return Object.fromEntries(
    [...body.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)].map(entry => [entry[1], entry[2].trim()])
  );
}

describe("tuỳ chỉnh màu giao diện", () => {
  const light = block(/:root,\s*\[data-theme="light"\]\s*\{/);
  const dark = block(/\[data-theme="dark"\]\s*\{/);

  it("bề mặt dùng để tính tương phản khớp index.css", () => {
    for (const [name, value] of Object.entries(SURFACE_TOKENS.light)) expect(light[name]).toBe(value);
    for (const [name, value] of Object.entries(SURFACE_TOKENS.dark)) expect(dark[name]).toBe(value);
  });

  it("preset mặc định trùng token chủ đạo và nhấn trong index.css", () => {
    const stock = COLOR_PRESETS[0];
    expect(light.primary).toBe(stock.primary);
    expect(light.accent).toBe(stock.accent);
  });

  it("script chống nháy trong index.html đọc đúng key lưu trữ", () => {
    const html = readFileSync(path.join(root, "client", "index.html"), "utf8");
    expect(html).toContain('"cfop-theme-colors"');
  });
});
