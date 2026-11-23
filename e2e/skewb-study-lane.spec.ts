import { expect, test } from "@playwright/test";

/**
 * E2E: tab "Học thêm" có lane Skewb.
 * Kiểm tra lane mở được, drawer danh mục gom nhóm, preview dialog,
 * chọn case và chuyển bộ Sarah Intermediate / Sarah Advanced.
 */
test("lane Skewb trong tab Học thêm: mở, nhóm, chọn case (Sarah Int + Adv)", async ({ page }) => {
  await page.goto("/study?lane=skewb");

  await expect(page.getByRole("button", { name: /^Skewb(\s|$)/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/10 Sarah Intermediate/)).toBeVisible();

  // Drawer danh mục: nhóm 1T có đủ 2 trigger
  await page.getByText("Danh mục Skewb").click();
  await page.getByText("1T", { exact: true }).first().click();
  await expect(page.locator("strong", { hasText: "Sarah Int · Sledgehammer" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Học case này" }).first()).toBeVisible();

  // Xem preview rồi chọn case trong dialog
  await page.getByRole("button", { name: "Xem trước SI-Sledgehammer" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Học case này" }).click();
  await expect(page.getByRole("heading", { name: "Sarah Int · Sledgehammer" })).toBeVisible();

  // Công thức ẩn, hiện khi bấm
  await page.getByRole("button", { name: /Xem công thức|Show algorithm/i }).click();
  await expect(page.locator("pre")).toContainText("R' F R F'");

  // Đổi sang Sarah Advanced: 93 case, lưới nhóm tự mở (openGroup 1T không tồn tại)
  await page.getByRole("button", { name: /Sarah Adv · 93/, exact: true }).click();
  await expect(page.getByText(/93 Sarah Advanced case/)).toBeVisible();
  await expect(page.getByText("PiV", { exact: true }).first()).toBeVisible();
});
