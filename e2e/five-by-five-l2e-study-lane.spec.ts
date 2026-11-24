import { expect, test } from "@playwright/test";

test("lane 5×5 L2E trong tab Học thêm: mở, nhóm, chọn case", async ({ page }) => {
  await page.goto("/study?lane=l2e");

  await expect(page.getByRole("button", { name: /^5×5 L2E(\s|$)/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/15 case Last Two Edges/)).toBeVisible();

  await page.getByText("Danh mục 5×5 L2E").click();
  await page.locator("strong", { hasText: /^L2E$/ }).click();
  await expect(page.locator("strong", { hasText: /^L2E 1$/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Học case này" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Xem trước L2E-1", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Học case này" }).click();
  await expect(page.getByRole("heading", { name: "L2E 1" })).toBeVisible();

  await page.getByRole("button", { name: /Xem công thức|Show algorithm/i }).click();
  await expect(page.locator("pre")).toContainText("Rw' U' R' U R' F R F' Rw");
});
