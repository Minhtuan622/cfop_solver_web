import { expect, test } from "@playwright/test";

/**
 * E2E: tab "Học thêm" có lane 2×2 CLL.
 * Kiểm tra lane mở được, lọc nhóm subset, tìm kiếm và chọn case.
 */
test("lane 2×2 trong tab Học thêm: mở, lọc, chọn case", async ({ page }) => {
  await page.goto("/study?lane=2x2");

  await expect(page.getByRole("button", { name: "2×2", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/40 CLL case/)).toBeVisible();

  // Catalog: lọc Sune cho thấy 6 case
  await page.getByRole("button", { name: "Sune", exact: true }).click();
  await expect(page.getByText(/6 case|6 cases/)).toBeVisible();

  // Đổi sang AS và tìm CLL-AS-1, chọn nó
  await page.getByRole("button", { name: "AS", exact: true }).click();
  await expect(page.getByText(/6 case|6 cases/)).toBeVisible();
  await page.getByRole("button", { name: /CLL Antisune 1/ }).first().click();
  await expect(
    page.getByRole("heading", { name: "CLL Antisune 1" }),
  ).toBeVisible();

  // Toán ẩn được, hiện ra khi bấm
  await page.getByRole("button", { name: /Xem công thức|Show algorithm/i }).click();
  await expect(page.locator("pre")).toContainText("U R U2 R' U' R U' R'");

  // Toggle 2D/3D không crash
  await page.getByRole("button", { name: /3D/, exact: true }).click();
});
