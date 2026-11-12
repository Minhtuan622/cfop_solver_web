import { expect, test } from "@playwright/test";

/**
 * Kịch bản e2e: bộ giải phải chạy được bằng bản Pyodide cục bộ.
 *
 * Đề bài yêu cầu build không được âm thầm bỏ bản Pyodide cục bộ: nếu
 * không có nó, trình duyệt sẽ gọi CDN và bộ giải sẽ hỏng khi offline.
 * Bài test này giữ đúng hai điều đó: không có request nào tới
 * cdn.jsdelivr.net, và lần giải sau vẫn thành công khi đã cắt mạng.
 */
test("bộ giải chạy bằng Pyodide cục bộ và vẫn giải được khi offline", async ({
  page,
  context,
}) => {
  const cdnRequests: string[] = [];
  const localRequests: string[] = [];

  page.on("request", request => {
    const url = request.url();
    if (url.includes("cdn.jsdelivr.net")) cdnRequests.push(url);
    if (url.includes("/pyodide/")) localRequests.push(url);
  });

  await page.goto("/");
  await page.locator("#home-scramble").fill("R U R' U'");
  await page.getByRole("button", { name: /Tìm cách giải/ }).click();

  // "Lời giải" chỉ là tiêu đề panel, luôn có; dấu hiệu thật là bảng tóm
  // tắt số nước đã tìm ra.
  await expect(page.getByText(/^\d+ nước · \d+ bước$/)).toBeVisible({
    timeout: 120_000,
  });

  // Pyodide phải đến từ máy chủ, không phải từ CDN. (Số request tới
  // /pyodide/ không dùng để kết luận: khi nhiều bài test chạy song song,
  // trình duyệt có thể lấy Pyodide từ bộ nhớ đệm, nên không có request nào.)
  expect(cdnRequests).toEqual([]);
  const localModule = await page.request.get("/pyodide/pyodide.mjs");
  expect(localModule.status()).toBe(200);

  // Đường dẫn Pyodide không có file phải trả 404 chứ không rơi vào
  // index.html của SPA.
  const missing = await page.request.get("/pyodide/does-not-exist.js");
  expect(missing.status()).toBe(404);
  expect(missing.headers()["content-type"]).toContain("application/json");

  // Cắt mạng rồi giải lại: bộ giải phải vẫn chạy được.
  await context.setOffline(true);
  // Chờ solver xong hẳn (nút "Tìm cách giải" trở lại) rồi giải lại.
  await expect(page.getByRole("button", { name: /Tìm cách giải/ })).toBeVisible({
    timeout: 120_000,
  });
  await page.locator("#home-scramble").fill("R U R' U'");
  await page.getByRole("button", { name: /Tìm cách giải/ }).click();

  await expect(page.getByText(/^\d+ nước · \d+ bước$/)).toBeVisible({
    timeout: 120_000,
  });
  expect(cdnRequests).toEqual([]);

  await context.setOffline(false);
});
