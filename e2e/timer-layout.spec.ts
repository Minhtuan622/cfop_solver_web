import { expect, test } from "@playwright/test";

test("trang Bấm giờ không bị bóp cột", async ({ page }) => {
  await page.goto("/timer");
  await page.waitForTimeout(1500);

  await page.locator("details", { hasText: "Phân tích" }).first().locator("summary").click();

  const analytics = page.locator(
    'section[aria-labelledby="timer-analytics-heading"]'
  );
  await expect(analytics).toBeVisible();
  const analyticsWidth = (await analytics.boundingBox())?.width ?? 0;
  const parentWidth =
    (await analytics.evaluate(node => {
      const parent = node.parentElement;
      return parent ? parent.getBoundingClientRect().width : 0;
    })) ?? 0;
  expect(analyticsWidth).toBeGreaterThan(parentWidth * 0.9);

  const newCase = page
    .getByRole("button", { name: /tạo case mới|new case/i })
    .first();
  await expect(newCase).toBeVisible();
  const box = (await newCase.boundingBox()) ?? { width: 0, height: 0 };
  expect(box.width).toBeGreaterThan(30);
  expect(box.height).toBeLessThan(70);
});
