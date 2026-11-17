import { expect, test } from "@playwright/test";

/**
 * E2E: tab "Học thêm" có lane Square-1.
 * Kiểm tra lane mở được, drawer danh mục gom nhóm, preview dialog,
 * chọn case và chuyển bộ CS / CP.
 */
test("lane Square-1 trong tab Học thêm: mở, nhóm, chọn case (CS + CP)", async ({ page }) => {
  await page.goto("/study?lane=sq1");

  await expect(page.getByRole("button", { name: "Square-1", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/169 Cube Shape case/)).toBeVisible();

  // Drawer danh mục: nhóm 4 Slashes có đủ 45 case
  await page.getByText("Danh mục Square-1").click();
  await page.getByText("4 Slashes", { exact: true }).first().click();
  await expect(page.locator("strong", { hasText: "Pair / 4-2 Right" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Học case này" }).first()).toBeVisible();

  // Xem preview rồi chọn case trong dialog
  await page.getByRole("button", { name: "Xem trước Pair-4-2-Right" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Học case này" }).click();
  await expect(page.getByRole("heading", { name: "Pair / 4-2 Right" })).toBeVisible();

  // Công thức ẩn, hiện khi bấm
  await page.getByRole("button", { name: /Xem công thức|Show algorithm/i }).click();
  await expect(page.locator("pre")).toContainText("(-2,0) / (1,2) / (-3,-3) /");

  // Đổi sang CP: 8 case, nhóm Top Adj
  await page.getByRole("button", { name: "CP · 8", exact: true }).click();
  await expect(page.getByText(/8 CP case/)).toBeVisible();
  await page.getByText("Top Adj", { exact: true }).first().click();
  await expect(page.locator("strong", { hasText: "Adj / Adj" })).toBeVisible();
});
