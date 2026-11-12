import { expect, test } from "@playwright/test";

/**
 * Regression test cho lỗi trên Safari: danh sách dropdown tự vẽ bị cắt mất
 * khi nút nằm trong card có `overflow-hidden` hoặc gần đáy khung nhìn.
 *
 * Danh sách phải nổi qua portal (không bị card cắt) và lật lên trên nút khi
 * phía dưới không còn đủ chỗ, nằm gọn trong khung nhìn.
 */
test("dropdown tự vẽ lật lên khi mở gần đáy khung nhìn", async ({ page }) => {
  // Khung nhìn thấp để ép tình huống "không đủ chỗ bên dưới".
  await page.setViewportSize({ width: 1280, height: 480 });
  await page.route(
    "**/api/trpc/cfopAccount.me**",
    (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify([{ result: { data: { json: null } } }]),
      }),
  );

  await page.goto("/timer");
  const trigger = page.getByLabel("Loại khối");
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveText(/3×3×3/, { timeout: 45_000 });

  // Đặt nút xuống sát đáy khung nhìn: phía dưới không còn chỗ trống.
  await trigger.evaluate((element) => element.scrollIntoView({ block: "end" }));
  await trigger.click();

  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();

  const list = await listbox.boundingBox();
  const button = await trigger.boundingBox();
  expect(list).not.toBeNull();
  expect(button).not.toBeNull();
  // Lật lên: mép trên của danh sách ở trên mép trên của nút.
  expect(list!.y).toBeLessThan(button!.y);
  // Danh sách nằm gọn trong khung nhìn, không bị cắt đáy.
  expect(list!.y).toBeGreaterThanOrEqual(0);
  expect(list!.y + list!.height).toBeLessThanOrEqual(480 + 1);
});
