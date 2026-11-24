import { expect, test } from "@playwright/test";

test("lane CFOP trong tab Học thêm: mở, chọn family, chọn case", async ({ page }) => {
  await page.goto("/study?lane=cfop");

  await expect(page.getByRole("button", { name: /^CFOP(\s|$)/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/F2L 164|41 × 4/)).toBeVisible();

  await page.getByText("Danh mục CFOP").click();
  await page.getByRole("combobox", { name: "Loại case" }).click();
  await page.getByRole("option", { name: "OLL", exact: true }).click();
  await expect(page.getByText("0/57")).toBeVisible();

  await page.getByRole("button", { name: /Xem trước oll/ }).click();
  await page.getByPlaceholder(/Tìm|Search/i).fill("Sune");
  await expect(page.locator("strong", { hasText: "OLL 26 (Sune)" })).toBeVisible();
  await page.getByRole("button", { name: "Xem trước OLL-26" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Học case này" }).click();
  await expect(page.getByRole("heading", { name: /OLL 26/ })).toBeVisible();

  await expect(page.getByText(/Danh mục CFOP 3×3/)).toBeVisible();

  await page.getByRole("button", { name: /3D/, exact: true }).click();
});
