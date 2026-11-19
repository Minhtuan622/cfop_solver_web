import { expect, test } from "@playwright/test";

/**
 * E2E: tab "Học thêm" có lane FTO L3T.
 * Kiểm tra lane mở được, drawer danh mục gom 3 nhóm PF/TL/LT, preview
 * dialog, chọn case PF 1.
 */
test("lane FTO L3T trong tab Học thêm: mở, nhóm, chọn case", async ({ page }) => {
  await page.goto("/study?lane=l3t");

  await expect(page.getByRole("button", { name: "FTO L3T", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/17 case 3-Look/)).toBeVisible();

  // Drawer danh mục: 3 nhóm PF / TL / LT
  await page.getByText("Danh mục FTO L3T").click();
  await expect(page.locator("strong", { hasText: /^PF$/ })).toBeVisible();
  await expect(page.locator("strong", { hasText: /^TL$/ })).toBeVisible();
  await expect(page.locator("strong", { hasText: /^LT$/ })).toBeVisible();

  // Mở nhóm TL, chọn TL 2
  await page.locator("strong", { hasText: /^TL$/ }).click();
  await expect(page.locator("strong", { hasText: /^TL 2$/ })).toBeVisible();

  // Xem preview rồi chọn case trong dialog
  await page.getByRole("button", { name: "Xem trước TL-2", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Học case này" }).click();
  await expect(page.getByRole("heading", { name: "TL 2" })).toBeVisible();

  // Công thức ẩn, hiện khi bấm
  await page.getByRole("button", { name: /Xem công thức|Show algorithm/i }).click();
  await expect(page.locator("pre")).toContainText("R U' R' U");
});
