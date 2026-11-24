import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8")) as T;
}

type PackageJson = {
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
  packageManager?: string;
};

describe("script test:e2e", () => {
  const pkg = readJson<PackageJson>("package.json");

  it("gọi playwright test mà không hardcode đường dẫn Chromium hệ thống", () => {
    const script = pkg.scripts?.["test:e2e"];
    expect(script).toBeDefined();
    expect(script).toBe("playwright test");
    expect(script).not.toContain("/usr/bin/chromium");
    expect(script).not.toContain("PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH");
  });

  it("không để đường dẫn Chromium hệ thống ở bất kỳ script nào", () => {
    const offending = Object.entries(pkg.scripts ?? {})
      .filter(([, command]) => command.includes("/usr/bin/chromium"))
      .map(([name]) => name);
    expect(offending).toEqual([]);
  });
});

describe("playwright.config.ts", () => {
  const config = readFileSync(path.join(root, "playwright.config.ts"), "utf8");

  it("coi PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH là tuỳ chọn", () => {
    expect(config).toContain("PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH");
    expect(config).toMatch(/chromiumPath\s*\?\s*\{/);
  });
});

describe("CI workflow", () => {
  const workflow = readFileSync(
    path.join(root, ".github/workflows/ci.yml"),
    "utf8"
  );

  it("cài Chromium của Playwright trước khi chạy e2e", () => {
    expect(workflow).toContain("playwright install");
    expect(workflow).toContain("pnpm test:e2e");
  });

  it("không trỏ PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH vào đường dẫn hệ thống", () => {
    expect(workflow).not.toContain("/usr/bin/chromium");
  });

  it("tải Chromium không phụ thuộc vào apt", () => {
    expect(workflow).not.toContain("playwright install --with-deps");
    expect(workflow).toContain("pnpm exec playwright install chromium");
  });

  it("không để bước cài gói hệ thống chặn cả pipeline", () => {
    expect(workflow).toMatch(
      /name: Install Chromium system packages \(best effort\)[\s\S]{0,120}continue-on-error: true/
    );
  });

  it("giới hạn thời gian bước cài gói hệ thống", () => {
    expect(workflow).toMatch(
      /name: Install Chromium system packages \(best effort\)[\s\S]{0,120}timeout-minutes: \d+/
    );
    expect(workflow).toContain("timeout 200 pnpm exec playwright install-deps chromium");
  });

  it("tải Chromium trước rồi mới cài gói hệ thống", () => {
    const browserIndex = workflow.indexOf("playwright install chromium");
    const depsIndex = workflow.indexOf("playwright install-deps chromium");
    expect(browserIndex).toBeGreaterThan(-1);
    expect(depsIndex).toBeGreaterThan(browserIndex);
  });
});

describe("tsconfig covers the e2e suite", () => {
  it("include e2e/**/* để lỗi cú pháp trong spec bị `pnpm check` bắt", () => {
    const tsconfig = JSON.parse(
      readFileSync(path.join(root, "tsconfig.json"), "utf8")
    ) as { include?: string[] };
    expect(tsconfig.include ?? []).toContain("e2e/**/*");
  });
});
