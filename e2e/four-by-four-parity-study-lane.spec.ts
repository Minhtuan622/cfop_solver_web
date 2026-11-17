import { expect, test } from "@playwright/test";

/**
 * E2E: tab "Học thêm" có lane 4×4 Parity.
 * Kiểm tra lane mở được, drawer danh mục gom nhóm, preview dialog,
 * chọn case PLL Parity.
 */
test("lane 4×4 Parity trong tab Học thêm: mở, nhóm, chọn case", async ({ page }) => {
  await page.goto("/study?lane=parity");

  await expect(page.getByRole("button", { name: "4×4 Parity", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/22 PLL Parity case/)).toBeVisible();

  // Drawer danh mục: nhóm PLL có đủ 22 case
  await page.getByText("Danh mục 4×4 Parity").click();
  await page.getByText("PLL", { exact: true }).first().click();
  await expect(page.locator("strong", { hasText: "OPP Parity" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Học case này" }).first()).toBeVisible();

  // Xem preview rồi chọn case trong dialog
  await page.getByRole("button", { name: "Xem trước OPP-Parity" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Học case này" }).click();
  await expect(page.getByRole("heading", { name: "OPP Parity" })).toBeVisible();

  // Công thức ẩn, hiện khi bấm (giữ nguyên notation gốc của nguồn)
  await page.getByRole("button", { name: /Xem công thức|Show algorithm/i }).click();
  await expect(page.locator("pre")).toContainText("2R2 U2 2R2 Uw2 2R2 Uw2");
});
