import { expect, test } from "@playwright/test";

/**
 * Kịch bản e2e: thanh điều hướng dính trên cùng khi cuộn và theo phong cách
 * phẳng — nền đặc theo theme, không kính mờ (`backdrop-filter`), không bóng.
 *
 * Trước đây thanh dùng chất liệu kính; đợt thiết kế lại tối giản đã bỏ kính mờ
 * (xem `docs/architecture/refactor-audit.md`). Bài này đo CSS đã biên dịch thật
 * trong trình duyệt để kính mờ hay bóng không quay lại.
 */
test("thanh điều hướng phẳng và dính trên cùng khi cuộn", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/");

  const bar = page.locator("header > div").first();
  await expect(bar).toBeVisible();

  const before = await bar.boundingBox();
  expect(before).not.toBeNull();

  // Trang chủ render nội dung theo sau khung vỏ, nên chờ trang đủ cao để cuộn
  // thay vì cuộn ngay khi DOM vừa xong.
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
  // Nền đặc: không trong suốt để chữ phía sau không lộ qua khi cuộn.
  const alpha = Number(
    styles.backgroundColor.match(/\/\s*([\d.]+)\s*\)/)?.[1] ??
      styles.backgroundColor.match(/rgba\([^)]*,\s*([\d.]+)\s*\)/)?.[1] ??
      1
  );
  expect(alpha).toBe(1);

  // Cuộn xong thanh vẫn ở đúng vị trí cũ, tức là sticky vẫn hoạt động.
  const after = await bar.boundingBox();
  expect(after).not.toBeNull();
  expect(after!.y).toBeCloseTo(before!.y, 0);
});
