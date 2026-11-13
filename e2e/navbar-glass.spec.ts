import { expect, test } from "@playwright/test";

/**
 * Kịch bản e2e: thanh điều hướng phải là một tấm kính thật — nền bán trong
 * suốt, làm mờ và tăng độ bão hoà nội dung phía sau — và vẫn dính trên cùng
 * khi cuộn trang.
 *
 * Unit test chỉ kiểm tra tên class; bài này kiểm tra CSS đã biên dịch thật sự
 * tạo ra `backdrop-filter` mà Safari/Chromium hiển thị.
 */
test("thanh điều hướng có chất liệu kính khi cuộn", async ({ page }) => {
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
      webkitBackdropFilter: style.getPropertyValue("-webkit-backdrop-filter"),
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
    };
  });

  expect(styles.backdropFilter).toContain("blur(40px)");
  expect(styles.backdropFilter).toContain("saturate(1.5)");
  // Safari cũ chỉ dùng thuộc tính có tiền tố; Tailwind xuất cả hai. Chromium
  // không trả giá trị có tiền tố trong computed style, còn WebKit thì có.
  if (styles.webkitBackdropFilter) {
    expect(styles.webkitBackdropFilter).toContain("blur(40px)");
  }
  expect(styles.backgroundImage).toContain("linear-gradient");

  // Nền phải còn trong suốt để nhìn xuyên qua lớp kính. `oklab(... / 0.55)`
  // và `rgba(..., 0.55)` đều có alpha ở cuối.
  const alpha = Number(
    styles.backgroundColor.match(/\/\s*([\d.]+)\s*\)/)?.[1] ??
      styles.backgroundColor.match(/,\s*([\d.]+)\s*\)/)?.[1]
  );
  expect(alpha).toBeCloseTo(0.55, 2);

  // Cuộn xong thanh vẫn ở đúng vị trí cũ, tức là sticky vẫn hoạt động.
  const after = await bar.boundingBox();
  expect(after).not.toBeNull();
  expect(after!.y).toBeCloseTo(before!.y, 0);
});
