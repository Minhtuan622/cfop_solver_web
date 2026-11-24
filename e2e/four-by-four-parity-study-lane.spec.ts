import { expect, test } from "@playwright/test";

test("lane 4×4 Parity trong tab Học thêm: mở, nhóm, chọn case", async ({ page }) => {
  await page.goto("/study?lane=parity");

  await expect(page.getByRole("button", { name: /^4×4 Parity(\s|$)/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/22 PLL Parity case/)).toBeVisible();

  await page.getByText("Danh mục 4×4 Parity").click();
  await page.getByText("PLL", { exact: true }).first().click();
  await expect(page.locator("strong", { hasText: "OPP Parity" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Học case này" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Xem trước OPP-Parity" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Học case này" }).click();
  await expect(page.getByRole("heading", { name: "OPP Parity" })).toBeVisible();

  await page.getByRole("button", { name: /Xem công thức|Show algorithm/i }).click();
  await expect(page.locator("pre")).toContainText("2R2 U2 2R2 Uw2 2R2 Uw2");
});
