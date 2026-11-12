import { expect, test } from "@playwright/test";

/**
 * Kịch bản e2e: trang Bấm giờ không được bóp cột.
 *
 * Lỗi thật: một `<section>` trong lưới 12 cột bị bỏ sót `col-span-12`, nên nó
 * chỉ chiếm 1/12 chiều rộng (79px) và toàn bộ khối phân tích bị dồn vào một
 * cột hẹp, chữ xuống dòng từng ký tự. Một class `col-auto` của Bootstrap
 * (không tồn tại trong Tailwind) cũng làm nút bị bóp.
 *
 * Bài test đo chiều rộng thật trong trình duyệt, nên nó bắt được đúng lỗi
 * hiển thị chứ không phải lỗi cú pháp.
 */
test("trang Bấm giờ không bị bóp cột", async ({ page }) => {
  await page.goto("/timer");
  await page.waitForTimeout(1500);

  // Khối phân tích phải chiếm gần hết chiều rộng của lưới chứa nó.
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

  // Nút sinh đề mới không được dồn vào một cột hẹp.
  const newCase = page
    .getByRole("button", { name: /tạo case mới|new case/i })
    .first();
  await expect(newCase).toBeVisible();
  const box = (await newCase.boundingBox()) ?? { width: 0, height: 0 };
  expect(box.width).toBeGreaterThan(30);
  expect(box.height).toBeLessThan(70);
});
