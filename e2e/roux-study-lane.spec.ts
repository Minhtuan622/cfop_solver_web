import { expect, test } from "@playwright/test";

test("lane Roux: mở, thấy 42 case CMLL, chọn bộ LSE", async ({ page }) => {
  await page.goto("/study?lane=roux");
  await expect(page.getByRole("button", { name: /^Roux(\s|$)/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/42 case CMLL/).first()).toBeVisible();
  await page.getByRole("button", { name: /^LSE/ }).click();
  await expect(page.getByText(/công thức LSE/).first()).toBeVisible();

  await page.getByRole("button", { name: /^CMLL/ }).click();
  await page.getByText("Danh mục Roux").click();
  await page.getByText("Pi", { exact: true }).first().click();
  await expect(page.locator('svg[role="img"][aria-label^="CMLL-Pi"]').first()).toBeVisible({ timeout: 30_000 });
});

test("trang Giải: 3×3 Roux giải theo giai đoạn FB, SB, CMLL, LSE", async ({ page }) => {
  await page.route("**/api/trpc/cfopAccount.me**", route =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: null } } }]) })
  );
  await page.goto("/");
  await page.getByLabel("Loại khối").click();
  await page.getByRole("option", { name: "3×3 Roux" }).click();
  await expect(page.locator("#home-scramble")).not.toHaveValue("", { timeout: 30_000 });
  await page.locator("#home-scramble").fill("R U R' F2 D L B' U2 R F' D2 L' U");
  await page.getByRole("button", { name: "Tìm cách giải" }).click();
  const solution = page.getByTestId("other-puzzle-solution");
  await expect(solution).toBeVisible({ timeout: 120_000 });
  for (const phase of [/Khối đầu \(FB\)/, /Khối thứ hai \(SB\)/, /CMLL/, /LSE/])
    await expect(solution.getByRole("heading", { name: phase })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
