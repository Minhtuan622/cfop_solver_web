import { expect, test } from "@playwright/test";

test("lane 2×2 trong tab Học thêm: mở, nhóm, chọn case (CLL + PBL)", async ({ page }) => {
  await page.goto("/study?lane=2x2");

  await expect(page.getByRole("button", { name: /^2×2(\s|$)/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/40 CLL case/)).toBeVisible();

  await page.getByText("Danh mục 2×2").click();
  await page.getByText("Sune", { exact: true }).first().click();
  await expect(page.getByText("CLL Sune 1")).toBeVisible();
  await expect(page.getByRole("button", { name: "Học case này" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Tất cả nhóm" }).click();
  await page.getByText("AS", { exact: true }).first().click();
  await expect(page.locator("strong", { hasText: "CLL Antisune 1" })).toBeVisible();
  await page.getByRole("button", { name: "Xem trước CLL-AS-1" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Học case này" }).click();
  await expect(page.getByRole("heading", { name: "CLL Antisune 1" })).toBeVisible();

  await page.getByRole("button", { name: /Xem công thức|Show algorithm/i }).click();
  await expect(page.locator("pre")).toContainText("U R U2 R' U' R U' R'");

  await page.getByRole("button", { name: /3D/, exact: true }).click();

  await page.getByRole("button", { name: /PBL · 6/, exact: true }).click();
  await expect(page.getByText("Adj", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Diag", { exact: true }).first()).toBeVisible();
  await page.getByText("Diag", { exact: true }).first().click();
  await expect(page.locator("strong", { hasText: "PBL Diag 2" })).toBeVisible();
  await page.getByRole("button", { name: "Xem trước PBL-DIAG-2" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Học case này" }).click();
  await expect(page.getByRole("heading", { name: "PBL Diag 2" })).toBeVisible();
});
