import { expect, test } from "@playwright/test";

/**
 * Kịch bản e2e: trang đầu của Studio KHÔNG tải file .wasm của bộ giải; file
 * chỉ được tải khi người dùng bấm giải lần đầu, và lời giải hiện ra bình
 * thường.
 */
test("trang đầu không tải .wasm của bộ giải; chỉ tải sau khi bấm giải", async ({
  page,
}) => {
  const solverWasm: string[] = [];
  page.on("request", request => {
    const url = request.url();
    if (url.includes("solver_wasm_bg") && url.includes(".wasm")) solverWasm.push(url);
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#home-scramble")).toBeVisible();
  // Chờ thêm để chắc không có tải nền (warmup) nào.
  await page.waitForTimeout(1500);
  expect(solverWasm).toEqual([]);

  await page.locator("#home-scramble").fill("R U R' U'");
  await page.getByRole("button", { name: /Tìm cách giải/ }).click();

  await expect(page.getByText(/^\d+ nước · \d+ bước$/)).toBeVisible({
    timeout: 60_000,
  });
  expect(solverWasm.length).toBeGreaterThan(0);
  await expect(page.getByText("Không thể chạy solver")).toHaveCount(0);
});
