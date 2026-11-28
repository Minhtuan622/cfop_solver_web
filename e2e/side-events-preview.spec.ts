import { expect, test } from "@playwright/test";

test("Square-1 có mô hình 3D và nút chuyển 2D/3D, Clock chỉ có sơ đồ 2D", async ({ page }) => {
  await page.goto("/timer");
  const picker = page.getByLabel("Loại khối");
  await expect(picker).toHaveText(/3×3×3/);

  await picker.click();
  await page.getByRole("option", { name: "Square-1", exact: true }).first().click();
  const model = page.getByRole("img", { name: "Mô hình Square-1 3D" });
  await expect(model).toBeVisible({ timeout: 45_000 });
  await expect(model.locator("canvas")).toHaveCount(1, { timeout: 45_000 });
  await expect(model.locator("twisty-player")).toHaveCount(0);

  // The 2D/3D switch is on every preview that has a 3D model, and it sticks.
  const mode = page.getByRole("group", { name: "Kiểu hiển thị" });
  await mode.getByRole("button", { name: "2D" }).click();
  const flat = page.getByRole("img", { name: "Mô hình Square-1 2D" });
  await expect(flat.locator("twisty-player")).toHaveCount(1, { timeout: 45_000 });
  await mode.getByRole("button", { name: "3D" }).click();
  await expect(model.locator("canvas")).toHaveCount(1, { timeout: 45_000 });

  await picker.click();
  await page.getByRole("option", { name: "Clock", exact: true }).first().click();
  const host = page.getByRole("img", { name: "Mô hình Clock 2D" });
  await expect(host).toBeVisible({ timeout: 45_000 });
  const player = host.locator("twisty-player");
  await expect(player).toHaveCount(1);
  await expect(host.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Kiểu hiển thị" })).toHaveCount(0);
  await expect
    .poll(
      async () =>
        player.evaluate(node => {
          const rect = node.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }),
      { timeout: 45_000 }
    )
    .toBe(true);
});
