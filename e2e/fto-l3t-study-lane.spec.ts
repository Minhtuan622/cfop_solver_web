import { expect, test } from "@playwright/test";

test("lane FTO L3T trong tab Học thêm: mở, nhóm, chọn case", async ({ page }) => {
  await page.goto("/study?lane=l3t");

  await expect(page.getByRole("button", { name: /^FTO L3T(\s|$)/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/17 case 3-Look/)).toBeVisible();

  await page.getByText("Danh mục FTO L3T").click();
  await expect(page.locator("strong", { hasText: /^PF$/ })).toBeVisible();
  await expect(page.locator("strong", { hasText: /^TL$/ })).toBeVisible();
  await expect(page.locator("strong", { hasText: /^LT$/ })).toBeVisible();

  await page.locator("strong", { hasText: /^TL$/ }).click();
  await expect(page.locator("strong", { hasText: /^TL 2$/ })).toBeVisible();

  await page.getByRole("button", { name: "Xem trước TL-2", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Học case này" }).click();
  await expect(page.getByRole("heading", { name: "TL 2" })).toBeVisible();

  await page.getByRole("button", { name: /Xem công thức|Show algorithm/i }).click();
  await expect(page.locator("pre")).toContainText("R U' R' U");
});
