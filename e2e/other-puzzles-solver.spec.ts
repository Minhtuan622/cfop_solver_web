import { expect, test, type Page } from "@playwright/test";

/**
 * Bộ giải 2×2/Pyraminx/Skewb và thẻ "lời giải ngắn nhất" của trang Giải chạy
 * trên bộ tìm kiếm thật của cubing.js (worker + bảng tra), nên chỉ trình duyệt
 * thật mới bắt được lỗi đóng gói. Hai bài đều cần thời gian khởi tạo bảng tra.
 */
async function signedOut(page: Page) {
  await page.route("**/api/trpc/cfopAccount.me**", route =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: null } } }]),
    })
  );
}

const CASES = [
  { name: "2×2×2", scramble: "R U R' U' F2 R" },
  { name: "Pyraminx", scramble: "R U L' B' u" },
  { name: "Skewb", scramble: "R L' B R' L" },
] as const;

for (const { name, scramble } of CASES) {
  test(`giải ${name} từ scramble và hiện lời giải`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(String(error).slice(0, 200)));
    await signedOut(page);
    await page.goto("/puzzles");

    await page.getByRole("button", { name }).click();
    await page.getByLabel("Scramble").fill(scramble);
    await page.getByRole("button", { name: "Giải", exact: true }).click();

    const solution = page.getByTestId("other-puzzle-solution");
    await expect(solution).toBeVisible({ timeout: 120_000 });
    await expect(solution).not.toHaveText("");
    await expect(page.getByRole("alert")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("scramble sai ký hiệu báo lỗi dễ hiểu thay vì treo", async ({ page }) => {
  await signedOut(page);
  await page.goto("/puzzles");
  await page.getByLabel("Scramble").fill("Q Q Q");
  await page.getByRole("button", { name: "Giải", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible({ timeout: 60_000 });
});

test("trang Giải so lời giải CFOP với lời giải ngắn nhất", async ({ page }) => {
  await signedOut(page);
  await page.goto("/");
  await page.locator("#home-scramble").fill("R U R' U' F2 D L");
  await page.getByRole("button", { name: /Tìm cách giải/ }).click();
  await expect(page.getByText(/^\d+ nước · \d+ bước$/)).toBeVisible({
    timeout: 180_000,
  });

  await page.getByRole("button", { name: "Tìm lời giải ngắn" }).click();
  const shortest = page.getByTestId("optimal-solution");
  await expect(shortest).toBeVisible({ timeout: 120_000 });
  await expect(shortest).not.toHaveText("");
});
