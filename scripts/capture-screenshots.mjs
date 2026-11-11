import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

/**
 * Chụp ảnh màn hình cho README.
 *
 * Chạy với dev server đang bật:
 *   node scripts/capture-screenshots.mjs
 *
 * Ảnh được ghi vào docs/screenshots/ và README.md tham chiếu tới chúng.
 */
const BASE = process.env.SCREENSHOT_BASE_URL || "http://127.0.0.1:3000";
const OUT = "docs/screenshots";

const PAGES = [
  { file: "home.png", path: "/", wait: "networkidle" },
  { file: "timer.png", path: "/timer", wait: "networkidle" },
  { file: "results.png", path: "/history", wait: "networkidle" },
  { file: "study.png", path: "/study", wait: "networkidle" },
  { file: "settings.png", path: "/settings", wait: "networkidle" },
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

// Tài khoản giả để các trang cần đăng nhập vẫn render được.
await page.route("**/api/trpc/cfopAccount.me**", route =>
  route.fulfill({
    contentType: "application/json",
    body: JSON.stringify([
      {
        result: {
          data: {
            json: {
              id: 1,
              email: "demo@example.test",
              displayName: "Nguyễn Minh Tuấn",
              bio: "CFOP speedcuber",
              avatarUrl: "",
              goalMs: null,
              wcaId: null,
              createdAt: "2026-01-01T00:00:00.000Z",
              lastSignedIn: "2026-01-01T00:00:00.000Z",
            },
          },
        },
      },
    ]),
  }),
);

for (const item of PAGES) {
  await page.goto(`${BASE}${item.path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(item.wait === "networkidle" ? 1500 : 500);
  await page.screenshot({ path: `${OUT}/${item.file}`, fullPage: false });
  console.log(`✓ ${OUT}/${item.file}`);
}

await browser.close();
