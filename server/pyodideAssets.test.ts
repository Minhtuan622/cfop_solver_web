import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Regression test cho việc đóng gói Pyodide cục bộ.
 *
 * Bộ giải chạy trong trình duyệt nên Pyodide phải tải được. Trước đây nó
 * luôn lấy từ CDN, nên offline là bộ giải không dùng được. Nay bản phân phối
 * nằm trong `client/public/pyodide` (tải về lúc build), loader ưu tiên bản
 * cục bộ và CDN chỉ làm dự phòng.
 *
 * Các điều kiện dưới đây phải được giữ:
 * - script tải liệt kê đúng các file Pyodide thật sự được nạp lúc chạy;
 * - phiên bản ở script và ở loader phải khớp nhau;
 * - `build` và `dev` đều phải chạy script tải trước;
 * - thư mục tải về bị gitignore để repo không phình;
 * - dev server phải tự phục vụ được file trong `public/`, vì Vite gắn
 *   `?import` vào dynamic import và từ chối transform file trong `/public`.
 */

const root = path.resolve(import.meta.dirname, "..");

function read(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const REQUIRED_FILES = [
  "pyodide.mjs",
  "pyodide.asm.js",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
];

describe("đóng gói Pyodide cục bộ", () => {
  const fetchScript = read("scripts/fetch-pyodide.mjs");
  const loader = read("client/src/lib/pyodideLoader.ts");
  const viteConfig = read("vite.config.ts");
  const gitignore = read(".gitignore");
  const pkg = JSON.parse(read("package.json")) as {
    scripts?: Record<string, string>;
  };

  it("script tải liệt kê đủ các file Pyodide cần lúc chạy", () => {
    for (const file of REQUIRED_FILES) {
      expect(fetchScript, file).toContain(`"${file}"`);
    }
  });

  it("phiên bản ở script và ở loader khớp nhau", () => {
    const scriptVersion = fetchScript.match(
      /PYODIDE_VERSION\s*=\s*"([^"]+)"/
    )?.[1];
    const loaderVersion = loader.match(/PYODIDE_VERSION\s*=\s*"([^"]+)"/)?.[1];
    expect(scriptVersion).toBeTruthy();
    expect(loaderVersion).toBeTruthy();
    expect(scriptVersion).toBe(loaderVersion);
  });

  it("script tải bản mới nhất không dùng 'latest'", () => {
    expect(fetchScript).not.toContain("/latest/");
    expect(fetchScript).toMatch(/PYODIDE_VERSION\s*=\s*"\d+\.\d+\.\d+"/);
  });

  it("build và dev đều chạy script tải trước", () => {
    expect(pkg.scripts?.build).toContain("fetch-pyodide.mjs");
    expect(pkg.scripts?.dev).toContain("fetch-pyodide.mjs");
    expect(pkg.scripts?.["fetch-pyodide"]).toContain("fetch-pyodide.mjs");
  });

  it("CI tải Pyodide trước khi chạy e2e", () => {
    // Bài e2e giải khối cần Pyodide cục bộ; nếu CI chạy e2e trước khi tải
    // thì bài test sẽ phụ thuộc CDN hoặc thất bại.
    const workflow = read(".github/workflows/ci.yml");
    expect(workflow).toContain("pnpm fetch-pyodide");
    expect(workflow.indexOf("pnpm fetch-pyodide")).toBeLessThan(
      workflow.indexOf("pnpm test:e2e")
    );
  });

  it("thư mục tải về bị gitignore", () => {
    expect(gitignore).toContain("client/public/pyodide/");
  });

  it("loader ưu tiên bản cục bộ và có CDN dự phòng", () => {
    expect(loader).toContain('PYODIDE_LOCAL_BASE = "/pyodide/"');
    expect(loader).toContain("resolvePyodideSource");
    expect(loader).toContain("cdn.jsdelivr.net");
  });

  it("dev server tự phục vụ file Pyodide trong public/", () => {
    // Vite gắn '?import' vào dynamic import nên request '/pyodide/x?import'
    // bị chặn nếu không có middleware riêng.
    expect(viteConfig).toContain("localPyodidePlugin");
    expect(viteConfig).toContain('url.startsWith("/pyodide/")');
  });

  it("plugin Pyodide cục bộ thật sự được đăng ký vào danh sách plugin", () => {
    const pluginsBlock = viteConfig.match(/const plugins = \[[\s\S]*?\];/)?.[0];
    expect(pluginsBlock).toBeTruthy();
    expect(pluginsBlock).toContain("localPyodidePlugin()");
  });
});
