import { expect, test } from "@playwright/test";

test("lane Skewb trong tab Học thêm: mở, nhóm, chọn case (Sarah Int + Adv)", async ({ page }) => {
  await page.goto("/study?lane=skewb");

  await expect(page.getByRole("button", { name: /^Skewb(\s|$)/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/10 Sarah Intermediate/)).toBeVisible();

  await page.getByText("Danh mục Skewb").click();
  await page.getByText("1T", { exact: true }).first().click();
  await expect(page.locator("strong", { hasText: "Sarah Int · Sledgehammer" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Học case này" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Xem trước SI-Sledgehammer" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Học case này" }).click();
  await expect(page.getByRole("heading", { name: "Sarah Int · Sledgehammer" })).toBeVisible();

  await page.getByRole("button", { name: /Xem công thức|Show algorithm/i }).click();
  await expect(page.locator("pre")).toContainText("R' F R F'");

  await page.getByRole("button", { name: /Sarah Adv · 93/, exact: true }).click();
  await expect(page.getByText(/93 Sarah Advanced case/)).toBeVisible();
  await expect(page.getByText("PiV", { exact: true }).first()).toBeVisible();
});
