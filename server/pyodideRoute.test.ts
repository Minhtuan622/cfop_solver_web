import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { isPyodidePath } from "./_core/vite";

/**
 * Regression test cho C1 (điểm 3): đường dẫn /pyodide/ không có file phải
 * trả 404 chứ không rơi vào index.html của SPA.
 *
 * Nếu trả HTML với HTTP 200, trình duyệt sẽ cố chạy HTML như một module
 * JavaScript và báo lỗi khó hiểu thay vì "không tìm thấy".
 */

const root = path.resolve(import.meta.dirname, "..");

describe("đường dẫn /pyodide", () => {
  it("nhận diện đúng các đường dẫn Pyodide", () => {
    expect(isPyodidePath("/pyodide")).toBe(true);
    expect(isPyodidePath("/pyodide/")).toBe(true);
    expect(isPyodidePath("/pyodide/pyodide.mjs")).toBe(true);
    expect(isPyodidePath("/pyodide/nested/file.js")).toBe(true);
  });

  it("không nhận nhầm các đường dẫn khác", () => {
    expect(isPyodidePath("/")).toBe(false);
    expect(isPyodidePath("/profile")).toBe(false);
    expect(isPyodidePath("/assets/index.js")).toBe(false);
    expect(isPyodidePath("/pyodide-other/file.js")).toBe(false);
  });

  it("cả hai đường gọi trả về index.html đều chặn /pyodide", () => {
    // serveStatic (production) và setupVite (development) đều có phần fallback
    // về index.html; cả hai phải trả 404 cho /pyodide.
    const source = readFileSync(path.join(root, "server", "_core", "vite.ts"), "utf8");
    const guards = source.match(/isPyodidePath\(req\.originalUrl\.split\("\?"\)\[0\]\)/g) ?? [];
    expect(guards.length).toBe(2);
  });
});
