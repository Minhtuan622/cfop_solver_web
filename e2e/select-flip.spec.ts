import { expect, test } from "@playwright/test";

test("dropdown tự vẽ lật lên khi mở gần đáy khung nhìn", async ({ page }) => {
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

  await trigger.evaluate((element) => element.scrollIntoView({ block: "end" }));
  await trigger.click();

  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();

  const list = await listbox.boundingBox();
  const button = await trigger.boundingBox();
  expect(list).not.toBeNull();
  expect(button).not.toBeNull();
  expect(list!.y).toBeLessThan(button!.y);
  expect(list!.y).toBeGreaterThanOrEqual(0);
  expect(list!.y + list!.height).toBeLessThanOrEqual(480 + 1);
});
