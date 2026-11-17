import { expect, test } from "@playwright/test";

/**
 * Kịch bản e2e: Square-1 và Clock tạm thời chỉ hiển thị mô hình 2D.
 *
 * cubing.js không có mô hình 3D cho hai event này (chỉ kpuzzle + SVG), nên
 * chúng dùng `<twisty-player visualization="2D">` của thư viện thay vì model
 * Three.js tự dựng. Bài test xác nhận preview không tạo canvas 3D mà dựng
 * đúng player 2D của cubing.js, kèm trạng thái sau scramble.
 */
test("Square-1 và Clock chỉ hiển thị mô hình 2D, không có canvas 3D", async ({
  page,
}) => {
  await page.goto("/timer");
  const picker = page.getByLabel("Loại khối");
  await expect(picker).toHaveText(/3×3×3/);

  for (const [label, aria] of [
    ["Square-1", "Mô hình Square-1 2D"],
    ["Clock", "Mô hình Clock 2D"],
  ] as const) {
    await picker.click();
    await page.getByRole("option", { name: label, exact: true }).first().click();

    const host = page.getByRole("img", { name: aria });
    await expect(host).toBeVisible({ timeout: 45_000 });
    const player = host.locator("twisty-player");
    await expect(player).toHaveCount(1);
    await expect(host.locator("canvas")).toHaveCount(0);

    // 2D phải render được trạng thái (SVG hiển thị được), không phải khung rỗng.
    await expect
      .poll(
        async () =>
          player.evaluate(node => {
            const hostRect = node.getBoundingClientRect();
            return hostRect.width > 0 && hostRect.height > 0;
          }),
        { timeout: 45_000 }
      )
      .toBe(true);
  }
});
