import { expect, test } from "@playwright/test";

/**
 * Kịch bản e2e: bộ giải chạy hoàn toàn trong trình duyệt.
 *
 * Bộ giải (WebAssembly) được phục vụ cùng ứng dụng: không có request nào tới
 * CDN bên ngoài, và sau lần giải đầu tiên, cắt mạng rồi giải lại vẫn thành
 * công (worker và module đã nạp vẫn chạy).
 */
test("bộ giải không gọi CDN ngoài và vẫn giải được khi offline", async ({
  page,
  context,
}) => {
  const cdnRequests: string[] = [];
  const solverWasm: string[] = [];

  page.on("request", request => {
    const url = request.url();
    if (url.includes("cdn.jsdelivr.net")) cdnRequests.push(url);
    if (url.includes("solver_wasm_bg") && url.includes(".wasm")) solverWasm.push(url);
  });

  await page.goto("/");
  await page.locator("#home-scramble").fill("R U R' U'");
  await page.getByRole("button", { name: /Tìm cách giải/ }).click();

  // "Lời giải" chỉ là tiêu đề panel, luôn có; dấu hiệu thật là bảng tóm
  // tắt số nước đã tìm ra.
  await expect(page.getByText(/^\d+ nước · \d+ bước$/)).toBeVisible({
    timeout: 60_000,
  });

  // File .wasm đến từ chính máy chủ của ứng dụng, không phải từ CDN.
  expect(cdnRequests).toEqual([]);
  expect(solverWasm.length).toBeGreaterThan(0);
  const origin = new URL(page.url()).origin;
  for (const url of solverWasm) expect(new URL(url).origin).toBe(origin);

  // Cắt mạng rồi giải lại: bộ giải phải vẫn chạy được.
  await context.setOffline(true);
  // Chờ solver xong hẳn (nút "Tìm cách giải" trở lại) rồi giải lại.
  await expect(page.getByRole("button", { name: /Tìm cách giải/ })).toBeVisible({
    timeout: 60_000,
  });
  await page.locator("#home-scramble").fill("F R U R' U' F'");
  await page.getByRole("button", { name: /Tìm cách giải/ }).click();

  await expect(page.getByText(/^\d+ nước · \d+ bước$/)).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByText("Không thể chạy solver")).toHaveCount(0);
  expect(cdnRequests).toEqual([]);

  await context.setOffline(false);
});
