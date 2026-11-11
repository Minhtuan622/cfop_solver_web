import { chromium } from "@playwright/test";

/**
 * Kiểm chứng bộ giải chạy với Pyodide cục bộ (không gọi CDN).
 *
 * Chạy: node scripts/verify-local-pyodide.mjs
 */
const BASE = process.env.SCREENSHOT_BASE_URL || "http://127.0.0.1:3000";
const CDN = "cdn.jsdelivr.net";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const cdnRequests = [];
const localRequests = [];
const consoleErrors = [];
page.on("request", request => {
  const url = request.url();
  if (url.includes(CDN)) cdnRequests.push(url);
  if (url.includes("/pyodide/")) localRequests.push(url);
});
page.on("console", message => {
  if (message.type() === "error")
    consoleErrors.push(message.text().slice(0, 200));
});
page.on("pageerror", error =>
  consoleErrors.push(`PAGEERROR: ${String(error).slice(0, 200)}`)
);

await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.locator("#home-scramble").fill("R U R' U'");
await page.getByRole("button", { name: /Tìm cách giải/ }).click();

// Chờ lời giải xuất hiện (Pyodide phải nạp wasm + stdlib).
await page.waitForTimeout(3000);
await page
  .waitForFunction(
    () => {
      const text = document.body.innerText;
      return (
        text.includes("Không thể chạy solver") ||
        text.includes("Chưa có lời giải") === false
      );
    },
    { timeout: 180000 }
  )
  .catch(() => {});
await page.waitForTimeout(3000);

const body = await page.locator("body").innerText();
const hasError = body.includes("Không thể chạy solver");
const hasSolution = /Cross|F2L|OLL|PLL|Lời giải/.test(body);

console.log("=== kết quả ===");
console.log("báo lỗi:", hasError);
console.log("có lời giải:", hasSolution);
if (hasError) {
  const index = body.indexOf("Không thể chạy solver");
  console.log("nội dung lỗi:", body.slice(index, index + 400));
}
console.log("request CDN:", cdnRequests.length, cdnRequests.slice(0, 3));
console.log("request pyodide cục bộ:", localRequests.length);
for (const url of localRequests.slice(0, 8)) {
  console.log("   ", url.replace(BASE, ""));
}
console.log("lỗi console:", consoleErrors.slice(0, 5));

await page.screenshot({ path: "docs/screenshots/solver-solution.png" });
await browser.close();

process.exit(
  hasSolution &&
    !hasError &&
    cdnRequests.length === 0 &&
    localRequests.length > 0
    ? 0
    : 1
);
