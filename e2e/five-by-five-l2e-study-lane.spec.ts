import { expect, test } from "@playwright/test";

/**
 * E2E: tab "Học thêm" có lane 5×5 L2E.
 * Kiểm tra lane mở được, drawer danh mục gom nhóm "L2E", preview dialog,
 * chọn case L2E 1.
 */
test("lane 5×5 L2E trong tab Học thêm: mở, nhóm, chọn case", async ({ page }) => {
  await page.goto("/study?lane=l2e");

  await expect(page.getByRole("button", { name: "5×5 L2E", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/15 case Last Two Edges/)).toBeVisible();

  // Drawer danh mục: nhóm L2E có đủ 15 case
  await page.getByText("Danh mục 5×5 L2E").click();
  await page.locator("strong", { hasText: /^L2E$/ }).click();
  await expect(page.locator("strong", { hasText: /^L2E 1$/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Học case này" }).first()).toBeVisible();

  // Xem preview rồi chọn case trong dialog
  await page.getByRole("button", { name: "Xem trước L2E-1", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Học case này" }).click();
  await expect(page.getByRole("heading", { name: "L2E 1" })).toBeVisible();

  // Công thức ẩn, hiện khi bấm
  await page.getByRole("button", { name: /Xem công thức|Show algorithm/i }).click();
  await expect(page.locator("pre")).toContainText("Rw' U' R' U R' F R F' Rw");
});
