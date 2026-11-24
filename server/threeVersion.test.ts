import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function readJson(relativePath: string): Record<string, any> {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8")) as Record<string, any>;
}

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
