import { chromium, type FullConfig } from "@playwright/test";

/**
 * Mở trước các route chính một lần trước khi chạy test.
 *
 * `pnpm dev` (Vite) chỉ biên dịch module khi trình duyệt xin lần đầu, nên test
 * chạy đầu tiên của mỗi lượt có thể mất hơn 30 giây chỉ để tải trang và bị
 * timeout dù app không có lỗi. Khởi động sẵn ở đây để mọi test bắt đầu như nhau.
 */
export default async function globalSetup(config: FullConfig) {
  const { baseURL, launchOptions } = config.projects[0]?.use ?? {};
  if (!baseURL) return;
  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage();
    for (const route of ["/", "/timer", "/study?lane=cfop", "/history", "/play"]) {
      await page.goto(new URL(route, baseURL).toString(), {
        timeout: 180_000,
        waitUntil: "load",
      });
      // Các chunk 3D (Three.js, cubing.js) nạp lười sau khi trang mở; chờ mạng
      // yên để chúng cũng được biên dịch sẵn. Không bắt buộc, nên bỏ qua nếu quá lâu.
      await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => undefined);
    }
  } finally {
    await browser.close();
  }
}
