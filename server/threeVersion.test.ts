import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Regression test: app và cubing phải dùng chung một phiên bản three.js.
 *
 * Lỗi thật: một lần Dependabot nâng `three` lên 0.187 trong khi cubing vẫn
 * cần 0.170. Khi đó bundle có hai bản three: `Object3D.intersectsFrustum`
 * (còn trong 0.170) đã bị xoá ở 0.187, nên mô hình 3D của 4×4×4 ngẫu nhiên
 * hỏng với `object.intersectsFrustum is not a function` và bài test e2e
 * chạy lúc xanh lúc đỏ.
 *
 * Chỉ cần khoảng phiên bản của app trùng khoảng của cubing là pnpm cài đúng
 * một bản three cho cả hai.
 */

const root = path.resolve(import.meta.dirname, "..");

function readJson(relativePath: string): Record<string, any> {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8")) as Record<string, any>;
}

/** "0.170.0" -> "0.170" (bỏ phần patch, đủ để so sánh minor). */
function minorOf(range: string): string {
  return range.replace(/^[^0-9]*/, "").split(".").slice(0, 2).join(".");
}

describe("phiên bản three.js", () => {
  const app = readJson("package.json");
  const cubing = readJson(path.join("node_modules", "cubing", "package.json"));

  it("app khai báo cùng khoảng phiên bản với cubing", () => {
    expect(app.dependencies?.three).toBeTruthy();
    expect(cubing.dependencies?.three).toBeTruthy();
    expect(minorOf(app.dependencies.three)).toBe(minorOf(cubing.dependencies.three));
  });

  it("lockfile chỉ chứa một phiên bản three", () => {
    const lock = readFileSync(path.join(root, "pnpm-lock.yaml"), "utf8");
    const versions = Array.from(lock.matchAll(/^ {2}three@(\d+\.\d+\.\d+):/gm)).map(
      match => match[1],
    );
    expect(new Set(versions).size).toBe(1);
  });

  it("@types/three khớp với phiên bản three đang dùng", () => {
    expect(minorOf(app.devDependencies?.["@types/three"] ?? "")).toBe(
      minorOf(app.dependencies.three),
    );
  });
});
