import { expect, test } from "@playwright/test";

test("lane Square-1 trong tab Học thêm: mở, nhóm, chọn case (CS + CP)", async ({ page }) => {
  await page.goto("/study?lane=sq1");

  await expect(page.getByRole("button", { name: /^Square-1(\s|$)/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/169 Cube Shape case/)).toBeVisible();

  await page.getByText("Danh mục Square-1").click();
  await page.getByText("4 Slashes", { exact: true }).first().click();
  await expect(page.locator("strong", { hasText: "Pair / 4-2 Right" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Học case này" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Xem trước CS-Pair-4-2-Right" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Học case này" }).click();
  await expect(page.getByRole("heading", { name: "Pair / 4-2 Right" })).toBeVisible();

  await page.getByRole("button", { name: /Xem công thức|Show algorithm/i }).click();
  await expect(page.locator("pre")).toContainText("(-2,0) / (1,2) / (-3,-3) /");

  await page.getByRole("button", { name: "CP · 8", exact: true }).click();
  await expect(page.getByText(/8 CP case/)).toBeVisible();
  await page.getByText("Top Adj", { exact: true }).first().click();
  await expect(page.locator("strong", { hasText: "Adj / Adj" })).toBeVisible();
});
