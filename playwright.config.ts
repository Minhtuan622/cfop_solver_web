import { defineConfig } from "@playwright/test";

const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  // Khởi động sẵn dev server (Vite biên dịch module khi được xin lần đầu).
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    browserName: "chromium",
    headless: true,
    launchOptions: chromiumPath ? { executablePath: chromiumPath, args: ["--no-sandbox"] } : undefined,
  },
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    // `pnpm dev` build bộ giải WebAssembly trước khi khởi động nếu chưa có
    // (`scripts/ensure-solver.mjs`), nên lần chạy đầu tiên cần thêm thời gian.
    timeout: 120_000,
  },
});
