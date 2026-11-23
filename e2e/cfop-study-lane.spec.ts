import { expect, test } from "@playwright/test";

/**
 * E2E: tab "Học thêm" có lane CFOP (F2L / OLL / PLL).
 * Kiểm tra lane mở được, chọn family, mở nhóm OLL, tìm OLL 26 (Sune)
 * và kéo nó vào card luyện tập.
 */
test("lane CFOP trong tab Học thêm: mở, chọn family, chọn case", async ({ page }) => {
  await page.goto("/study?lane=cfop");

  await expect(page.getByRole("button", { name: /^CFOP(\s|$)/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/F2L 164|41 × 4/)).toBeVisible();

  // Drawer danh mục: chọn family OLL → nhóm oll với 57 case
  await page.getByText("Danh mục CFOP").click();
  await page.getByRole("combobox", { name: "Loại case" }).click();
  await page.getByRole("option", { name: "OLL", exact: true }).click();
  await expect(page.getByText("0/57")).toBeVisible();

  // Mở nhóm OLL, tìm Sune, chọn OLL 26
  await page.getByRole("button", { name: /Xem trước oll/ }).click();
  await page.getByPlaceholder(/Tìm|Search/i).fill("Sune");
  await expect(page.locator("strong", { hasText: "OLL 26 (Sune)" })).toBeVisible();
  await page.getByRole("button", { name: "Xem trước OLL-26" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Học case này" }).click();
  await expect(page.getByRole("heading", { name: /OLL 26/ })).toBeVisible();

  // Catalog header
  await expect(page.getByText(/Danh mục CFOP 3×3/)).toBeVisible();

  // 3D view toggle works
  await page.getByRole("button", { name: /3D/, exact: true }).click();
});
