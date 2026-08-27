import { expect, test } from "@playwright/test";

test("chỉ tải Cubing khi mở Timer và Three.js khi event cần canvas 3D", async ({ page }) => {
  const cubingRequests: string[] = [];
  const threeRequests: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (/\/cubing(?:[./-]|\.js)/i.test(url)) cubingRequests.push(url);
    if (/\/three(?:[./-]|\.js)/i.test(url)) threeRequests.push(url);
  });
  await page.route("**/api/trpc/cfopAccount.me**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: null } } }]) }));

  await page.goto("/");
  await page.waitForTimeout(500);
  expect(cubingRequests).toEqual([]);
  expect(threeRequests).toEqual([]);

  await page.goto("/timer");
  await expect(page.getByLabel("Loại khối")).toHaveValue("333");
  await expect.poll(() => cubingRequests.length, { timeout: 15_000 }).toBeGreaterThan(0);
  expect(threeRequests).toEqual([]);

  await page.getByLabel("Loại khối").selectOption("444");
  await expect(page.getByLabel("Mô hình 4×4×4 3D")).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => threeRequests.length, { timeout: 15_000 }).toBeGreaterThan(0);
});
