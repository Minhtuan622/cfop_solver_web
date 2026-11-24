import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { injectSharePreview, readSharePreview } from "./services/sharePreview";

const indexHtml = path.resolve("client/index.html");

describe("sharePreview", () => {
  it("đọc meta mặc định từ client/index.html", () => {
    const preview = readSharePreview(indexHtml);
    expect(preview.image).toBe("/og.png");
    expect(preview.title.length).toBeGreaterThan(0);
    expect(preview.description.length).toBeGreaterThan(0);
  });

  it("inject meta override vào html", () => {
    const html = `<meta property="og:title" content="A" /><meta property="og:description" content="B" /><meta property="og:image" content="/og.png" />`;
    const out = injectSharePreview(html, { title: "T", description: "D", image: "/og.png" });
    expect(out).toContain('content="T"');
    expect(out).toContain('content="D"');
    expect(out).toContain('content="/og.png"');
  });

  it("index.html kết quả inject có chứa /og.png", () => {
    const preview = readSharePreview(indexHtml);
    const html = fs.readFileSync(indexHtml, "utf8");
    expect(injectSharePreview(html, preview)).toContain('<meta property="og:image" content="/og.png" />');
  });
});
