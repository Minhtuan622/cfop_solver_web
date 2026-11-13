import { expect, test } from "@playwright/test";

/**
 * Kịch bản e2e: nút "TẠO MEMO 3-STYLE" phải chạy đúng nhánh BLD của worker.
 *
 * Lỗi thật: khi tách worker nặng/nhẹ, nhánh `command === "bld"` bị bỏ sót nên
 * worker chạy solver CFOP, trả payload không có `analysis`, và trang rơi vào
 * error boundary. Test này chạy worker thật trong trình duyệt để bắt đúng
 * regression đó, thay vì mock `analyzeBldInBrowser`.
 */
test("tạo memo 3-Style và hiện báo cáo BLD", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(String(error).slice(0, 200)));

  await page.goto("/");
  await page.getByRole("button", { name: "3×3 BLD" }).click();
  await page.locator("#home-scramble").fill("R U R' U'");
  await page.getByRole("button", { name: /TẠO MEMO 3-STYLE/ }).click();

  await expect(page.getByText("Memo và execution")).toBeVisible({
    timeout: 180_000,
  });
  await expect(page.getByText("3-Style BLD · Speffz")).toBeVisible();
  await expect(page.getByText("Đã xảy ra lỗi không mong muốn.")).toHaveCount(0);

  expect(errors).toEqual([]);
});
