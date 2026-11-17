import { expect, test } from "@playwright/test";

/**
 * E2E: tab "Học thêm" có lane CFOP mới (F2L / OLL / PLL).
 * Kiểm tra lane mở được, stats của lane hiển thị, catalog lọc được theo nhóm
 * và bấm chọn case kéo nó vào card luyện tập.
 */
test("lane CFOP trong tab Học thêm: mở, lọc, chọn case", async ({ page }) => {
  await page.goto("/study?lane=cfop");

  await expect(page.getByRole("button", { name: "CFOP", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/F2L 164|41 × 4/)).toBeVisible();

  // Catalog: lọc OLL cho thấy 57 case
  await page.getByRole("button", { name: "OLL", exact: true }).click();
  await expect(page.getByText(/57 case|57 cases/)).toBeVisible();

  // Tìm + chọn case Sune kéo nó vào card luyện
  await page.getByPlaceholder(/Tìm|Search/i).fill("Sune");
  await page.getByRole("button", { name: /OLL 26/ }).first().click();
  await expect(
    page.getByRole("heading", { name: /OLL 26/ })
  ).toBeVisible();

  // Catalog header
  await expect(page.getByText(/CFOP 3×3/)).toBeVisible();

  // 3D view toggle works
  await page.getByRole("button", { name: /3D/, exact: true }).click();
});
