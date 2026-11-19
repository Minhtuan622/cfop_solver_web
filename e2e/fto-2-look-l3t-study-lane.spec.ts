import { expect, test } from "@playwright/test";

/**
 * E2E: tab "Học thêm" có lane FTO 2-Look L3T.
 * Kiểm tra lane mở được, drawer danh mục gom 4 nhóm PF/TCP A/TCP B/TCP C,
 * preview dialog, chọn case TCP A1.
 */
test("lane FTO 2-Look L3T trong tab Học thêm: mở, nhóm, chọn case", async ({ page }) => {
  await page.goto("/study?lane=l3t2");

  await expect(page.getByRole("button", { name: "FTO 2-Look", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/44 case 2-Look/)).toBeVisible();

  // Drawer danh mục: 4 nhóm PF / TCP A / TCP B / TCP C
  await page.getByText("Danh mục FTO 2-Look L3T").click();
  await expect(page.locator("strong", { hasText: /^PF$/ })).toBeVisible();
  await expect(page.locator("strong", { hasText: /^TCP A$/ })).toBeVisible();
  await expect(page.locator("strong", { hasText: /^TCP B$/ })).toBeVisible();
  await expect(page.locator("strong", { hasText: /^TCP C$/ })).toBeVisible();

  // Mở nhóm TCP A, chọn TCP A1
  await page.locator("strong", { hasText: /^TCP A$/ }).click();
  await expect(page.locator("strong", { hasText: /^TCP A1$/ })).toBeVisible();

  // Xem preview rồi chọn case trong dialog
  await page.getByRole("button", { name: "Xem trước TCP-A1", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Học case này" }).click();
  await expect(page.getByRole("heading", { name: "TCP A1" })).toBeVisible();

  // Công thức ẩn, hiện khi bấm
  await page.getByRole("button", { name: /Xem công thức|Show algorithm/i }).click();
  await expect(page.locator("pre")).toContainText("R U' R' U");
});
