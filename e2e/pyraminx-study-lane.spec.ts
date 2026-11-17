import { expect, test } from "@playwright/test";

/**
 * E2E: tab "Học thêm" có lane Pyraminx.
 * Kiểm tra lane mở được, drawer danh mục gom nhóm, preview dialog,
 * tìm-kiếm/chọn case và chuyển bộ Last Layer / L4E.
 */
test("lane Pyraminx trong tab Học thêm: mở, nhóm, chọn case (LL + L4E)", async ({ page }) => {
  await page.goto("/study?lane=pyraminx");

  await expect(page.getByRole("button", { name: "Pyraminx", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/35 L4E case/)).toBeVisible();

  // Drawer danh mục: nhóm DES có đủ 5 case
  await page.getByText("Danh mục Pyraminx").click();
  await page.getByText("DES", { exact: true }).first().click();
  await expect(page.locator("strong", { hasText: "Down Edge Solved Sune" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Học case này" }).first()).toBeVisible();

  // Xem preview rồi chọn case trong dialog
  await page.getByRole("button", { name: "Xem trước L4E-DES-1" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Học case này" }).click();
  await expect(page.getByRole("heading", { name: "Down Edge Solved Sune" })).toBeVisible();

  // Công thức ẩn, hiện khi bấm
  await page.getByRole("button", { name: /Xem công thức|Show algorithm/i }).click();
  await expect(page.locator("pre")).toContainText("(R U R') U (R U R')");

  // Đổi sang Last Layer: 5 case, nhóm LL (openGroup DES không tồn tại → lưới nhóm tự mở)
  await page.getByRole("button", { name: /Last Layer · 5/, exact: true }).click();
  await expect(page.getByText(/5 Last Layer case/)).toBeVisible();
  await page.getByText("LL", { exact: true }).first().click();
  await expect(page.locator("strong", { hasText: "Last Layer Sune" })).toBeVisible();
});
