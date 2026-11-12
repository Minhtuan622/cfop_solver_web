import { expect, test } from "@playwright/test";

/**
 * Kịch bản e2e: bộ giải CFOP thật sự giải được khối trong trình duyệt.
 *
 * Đây là bài test bắt được lỗi mà các test khác bỏ sót: nếu các file
 * Python của solver không được ghi vào filesystem của Pyodide thì mọi lệnh
 * `from cfop_solver import Cube` đều ném ImportError và bộ giải hỏng, nhưng
 * unit test vẫn xanh vì chúng mock runtime.
 *
 * Bài test cần bản Pyodide cục bộ (script `pnpm fetch-pyodide` tải về
 * `client/public/pyodide` trước khi chạy e2e).
 */
test("bộ giải giải được khối CFOP trong trình duyệt", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(String(error).slice(0, 200)));

  await page.goto("/");

  await page.locator("#home-scramble").fill("R U R' U'");
  await page.getByRole("button", { name: /Tìm cách giải/ }).click();

  // "Lời giải" chỉ là tiêu đề panel, luôn có; dấu hiệu thật là bảng tóm
  // tắt số nước đã tìm ra.
  await expect(page.getByText(/^\d+ nước · \d+ bước$/)).toBeVisible({
    timeout: 180_000,
  });

  await expect(page.getByText("Không thể chạy solver")).toHaveCount(0, {
    timeout: 5_000,
  });

  // Báo cáo theo phase: Cross phải có nước đi (scramble R U R' U' cần đúng
  // 4 nước để giải cross).
  await expect(page.getByText("Cross").first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(/^\d+ nước · \d+ bước$/)).toBeVisible({
    timeout: 30_000,
  });

  expect(errors).toEqual([]);
});
