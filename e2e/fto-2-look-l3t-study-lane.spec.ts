import { expect, test } from "@playwright/test";

test("lane FTO 2-Look L3T trong tab Học thêm: mở, nhóm, chọn case", async ({ page }) => {
  await page.goto("/study?lane=l3t2");

  await expect(page.getByRole("button", { name: /^FTO 2-Look(\s|$)/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/44 case 2-Look/)).toBeVisible();

  await page.getByText("Danh mục FTO 2-Look L3T").click();
  await expect(page.locator("strong", { hasText: /^PF$/ })).toBeVisible();
  await expect(page.locator("strong", { hasText: /^TCP A$/ })).toBeVisible();
  await expect(page.locator("strong", { hasText: /^TCP B$/ })).toBeVisible();
  await expect(page.locator("strong", { hasText: /^TCP C$/ })).toBeVisible();

  await page.locator("strong", { hasText: /^TCP A$/ }).click();
  await expect(page.locator("strong", { hasText: /^TCP A1$/ })).toBeVisible();

  await page.getByRole("button", { name: "Xem trước TCP-A1", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Học case này" }).click();
  await expect(page.getByRole("heading", { name: "TCP A1" })).toBeVisible();

  await page.getByRole("button", { name: /Xem công thức|Show algorithm/i }).click();
  await expect(page.locator("pre")).toContainText("R U' R' U");
});
