import { expect, test } from "@playwright/test";

test("thanh điều hướng phẳng và dính trên cùng khi cuộn", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/");

  const bar = page.locator("header > div").first();
  await expect(bar).toBeVisible();

  const before = await bar.boundingBox();
  expect(before).not.toBeNull();

  await expect
    .poll(
      () =>
        page.evaluate(() => document.body.scrollHeight > window.innerHeight),
      { timeout: 15_000 }
    )
    .toBe(true);

  await page.evaluate(() => window.scrollTo(0, 600));
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);

  const styles = await bar.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      backdropFilter: style.backdropFilter,
      boxShadow: style.boxShadow,
      backgroundColor: style.backgroundColor,
    };
  });

  expect(styles.backdropFilter).toBe("none");
  expect(styles.boxShadow).toBe("none");
  const alpha = Number(
    styles.backgroundColor.match(/\/\s*([\d.]+)\s*\)/)?.[1] ??
      styles.backgroundColor.match(/rgba\([^)]*,\s*([\d.]+)\s*\)/)?.[1] ??
      1
  );
  expect(alpha).toBe(1);

  const after = await bar.boundingBox();
  expect(after).not.toBeNull();
  expect(after!.y).toBeCloseTo(before!.y, 0);
});
