import { expect, test } from "@playwright/test";

test("bộ giải giải được khối CFOP trong trình duyệt", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(String(error).slice(0, 200)));

  await page.goto("/");

  await page.locator("#home-scramble").fill("R U R' U'");
  await page.getByRole("button", { name: /Tìm cách giải/ }).click();

  await expect(page.getByText(/^\d+ nước · \d+ bước$/)).toBeVisible({
    timeout: 180_000,
  });

  await expect(page.getByText("Không thể chạy solver")).toHaveCount(0, {
    timeout: 5_000,
  });

  await expect(page.getByText("Cross").first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(/^\d+ nước · \d+ bước$/)).toBeVisible({
    timeout: 30_000,
  });

  expect(errors).toEqual([]);
});
