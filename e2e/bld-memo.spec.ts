import { expect, test } from "@playwright/test";

test("tạo memo 3-Style và hiện báo cáo BLD", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(String(error).slice(0, 200)));

  await page.goto("/");
  await page.getByLabel("Loại khối").click();
  await page.getByRole("option", { name: "3×3 BLD" }).click();
  await page.locator("#home-scramble").fill("R U R' U'");
  await page.getByRole("button", { name: /TẠO MEMO 3-STYLE/ }).click();

  test.setTimeout(240_000);

  await expect(page.getByText("Memo và execution")).toBeVisible({
    timeout: 180_000,
  });
  await expect(page.getByText("3-Style BLD · Speffz")).toBeVisible({
    timeout: 180_000,
  });
  await expect(page.getByText("Đã xảy ra lỗi không mong muốn.")).toHaveCount(0);

  expect(errors).toEqual([]);
});
