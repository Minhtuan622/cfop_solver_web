import { expect, test } from "@playwright/test";

test("lane Pyraminx trong tab Học thêm: mở, nhóm, chọn case (LL + L4E)", async ({ page }) => {
  await page.goto("/study?lane=pyraminx");

  await expect(page.getByRole("button", { name: /^Pyraminx(\s|$)/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/35 L4E case/)).toBeVisible();

  await page.getByText("Danh mục Pyraminx").click();
  await page.getByText("DES", { exact: true }).first().click();
  await expect(page.locator("strong", { hasText: "Down Edge Solved Sune" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Học case này" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Xem trước L4E-DES-1" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Học case này" }).click();
  await expect(page.getByRole("heading", { name: "Down Edge Solved Sune" })).toBeVisible();

  await page.getByRole("button", { name: /Xem công thức|Show algorithm/i }).click();
  await expect(page.locator("pre")).toContainText("(R U R') U (R U R')");

  await page.getByRole("button", { name: /Last Layer · 5/, exact: true }).click();
  await expect(page.getByText(/5 Last Layer case/)).toBeVisible();
  await page.getByText("LL", { exact: true }).first().click();
  await expect(page.locator("strong", { hasText: "Last Layer Sune" })).toBeVisible();
});
