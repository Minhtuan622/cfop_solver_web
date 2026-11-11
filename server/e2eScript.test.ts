import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Regression test cho D4 (`test:e2e` phải dùng Chromium do Playwright quản lý).
 *
 * Lỗi thật: một lần merge PR của Dependabot (nhánh được tạo từ `main` cũ)
 * đã khôi phục lại đường dẫn Chromium hệ thống cứng `/usr/bin/chromium`.
 * Đường dẫn đó không tồn tại trên `ubuntu-latest` của GitHub Actions (Chromium
 * của Playwright nằm trong `~/.cache/ms-playwright/...`), khiến bước e2e trong
 * CI luôn fail. Test này chặn việc đường dẫn hệ thống bị hardcode lại.
 */

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
    // `playwright install --with-deps` chạy apt trước khi tải browser: một
    // lần DNS hỏng tới mirror Ubuntu đã làm cả step fail dù browser chưa
    // kịp tải. Việc cài gói hệ thống phải là bước riêng, không chặn browser.
    expect(workflow).not.toContain("playwright install --with-deps");
    expect(workflow).toContain("pnpm exec playwright install chromium");
  });

  it("không để bước cài gói hệ thống chặn cả pipeline", () => {
    expect(workflow).toMatch(
      /name: Install Chromium system packages \(best effort\)[\s\S]{0,120}continue-on-error: true/
    );
  });

  it("giới hạn thời gian bước cài gói hệ thống", () => {
    // Một lần apt chạy với mirror chết mất mười phút: không có chặn thời
    // gian, bước này ăn hết budget của job và kéo cả pipeline xuống.
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
    // Nếu thư mục e2e không nằm trong tsconfig, một spec sai cú pháp vẫn
    // pass typecheck và chỉ lộ ra khi Playwright chạy trên CI.
    const tsconfig = JSON.parse(
      readFileSync(path.join(root, "tsconfig.json"), "utf8")
    ) as { include?: string[] };
    expect(tsconfig.include ?? []).toContain("e2e/**/*");
  });
});
