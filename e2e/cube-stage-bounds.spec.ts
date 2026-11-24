import { expect, test, type Page } from "@playwright/test";

async function cubeOverflow(page: Page) {
  return page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>(".interactive-cube-stage");
    if (!stage) return null;
    const canvas = stage.querySelector("canvas");
    if (!canvas) return null;
    const stageBox = stage.getBoundingClientRect();
    const canvasBox = canvas.getBoundingClientRect();
    return {
      stageHeight: Math.round(stageBox.height),
      top: Math.round(stageBox.top - canvasBox.top),
      bottom: Math.round(canvasBox.bottom - stageBox.bottom),
      left: Math.round(stageBox.left - canvasBox.left),
      right: Math.round(canvasBox.right - stageBox.right),
    };
  });
}

function expectContained(
  overflow: Awaited<ReturnType<typeof cubeOverflow>>,
  label: string
) {
  expect(overflow, `${label}: không tìm thấy stage`).not.toBeNull();
  expect(overflow!.top, `${label}: tràn trên`).toBeLessThanOrEqual(1);
  expect(overflow!.bottom, `${label}: tràn dưới`).toBeLessThanOrEqual(1);
  expect(overflow!.left, `${label}: tràn trái`).toBeLessThanOrEqual(1);
  expect(overflow!.right, `${label}: tràn phải`).toBeLessThanOrEqual(1);
}

test("cube 3D nằm gọn trong stage khi xoay và zoom", async ({ page }) => {
  await page.goto("/play");

  const stage = page.locator(".interactive-cube-stage").first();
  await expect(stage).toBeVisible({ timeout: 90_000 });
  await stage.scrollIntoViewIfNeeded();

  const initial = await cubeOverflow(page);
  expect(initial!.stageHeight).toBeGreaterThanOrEqual(230);
  expectContained(initial, "mặc định");

  const box = await stage.boundingBox();
  expect(box).not.toBeNull();
  const centerX = box!.x + box!.width / 2;
  const centerY = box!.y + box!.height / 2;

  for (const [dx, dy] of [
    [160, 0],
    [0, 80],
    [-160, 0],
    [0, -80],
    [120, 60],
    [-120, -60],
  ]) {
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + dx, centerY + dy, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(350);
  }

  await page.mouse.move(centerX, centerY);
  for (let step = 0; step < 10; step += 1) {
    await page.mouse.wheel(0, -120);
  }
  await page.waitForTimeout(600);

  expectContained(await cubeOverflow(page), "xoay + zoom tối đa");
});
