import { expect, test } from "@playwright/test";

test("bộ giải không gọi CDN ngoài và vẫn giải được khi offline", async ({
  page,
  context,
}) => {
  const cdnRequests: string[] = [];
  const solverWasm: string[] = [];

  page.on("request", request => {
    const url = request.url();
    if (url.includes("cdn.jsdelivr.net")) cdnRequests.push(url);
    if (url.includes("solver_wasm_bg") && url.includes(".wasm")) solverWasm.push(url);
  });

  await page.goto("/");
  await page.locator("#home-scramble").fill("R U R' U'");
  await page.getByRole("button", { name: /Tìm cách giải/ }).click();

  await expect(page.getByText(/^\d+ nước · \d+ bước$/)).toBeVisible({
    timeout: 60_000,
  });

  expect(cdnRequests).toEqual([]);
  expect(solverWasm.length).toBeGreaterThan(0);
  const origin = new URL(page.url()).origin;
  for (const url of solverWasm) expect(new URL(url).origin).toBe(origin);

  await context.setOffline(true);
  await expect(page.getByRole("button", { name: /Tìm cách giải/ })).toBeVisible({
    timeout: 60_000,
  });
  await page.locator("#home-scramble").fill("F R U R' U' F'");
  await page.getByRole("button", { name: /Tìm cách giải/ }).click();

  await expect(page.getByText(/^\d+ nước · \d+ bước$/)).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByText("Không thể chạy solver")).toHaveCount(0);
  expect(cdnRequests).toEqual([]);

  await context.setOffline(false);
});
