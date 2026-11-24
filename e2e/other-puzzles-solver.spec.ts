import { expect, test, type Page } from "@playwright/test";

/**
 * Bộ giải 2×2/Pyraminx/Skewb và tab 3×3 FM của trang Giải chạy
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
  { name: "Megaminx", scramble: "R++ D-- R-- D++ U" },
  { name: "3×3 OH", scramble: "R U R' U' F2 D L" },
] as const;

for (const { name, scramble } of CASES) {
  test(`giải ${name} từ scramble và hiện lời giải`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(String(error).slice(0, 200)));
    await signedOut(page);
    await page.goto("/");

    await page.getByLabel("Loại khối").click();
    await page.getByRole("option", { name }).click();
    // Mở khối nào là có sẵn scramble của khối đó.
    await expect(page.locator("#home-scramble")).not.toHaveValue("", { timeout: 30_000 });
    await page.locator("#home-scramble").fill(scramble);
    await page.getByRole("button", { name: "Tìm cách giải" }).click();

    const solution = page.getByTestId("other-puzzle-solution");
    await expect(solution).toBeVisible({ timeout: 120_000 });
    await expect(solution).not.toHaveText("");
    await expect(page.getByRole("alert")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("scramble sai ký hiệu báo lỗi dễ hiểu thay vì treo", async ({ page }) => {
  await signedOut(page);
  await page.goto("/");
  await page.getByLabel("Loại khối").click();
  await page.getByRole("option", { name: "2×2×2" }).click();
  await page.locator("#home-scramble").fill("Q Q Q");
  await page.getByRole("button", { name: "Tìm cách giải" }).click();
  await expect(page.getByRole("alert")).toBeVisible({ timeout: 60_000 });
});

test("tab 3×3 FM tìm lời giải ngắn cho scramble có sẵn", async ({ page }) => {
  await signedOut(page);
  await page.goto("/");
  await page.getByLabel("Loại khối").click();
  await page.getByRole("option", { name: "3×3 FM" }).click();
  await expect(page.locator("#home-scramble")).not.toHaveValue("", { timeout: 30_000 });
  await page.getByRole("button", { name: "Tìm cách giải" }).click();
  const solution = page.getByTestId("other-puzzle-solution");
  await expect(solution).toBeVisible({ timeout: 120_000 });
  await expect(solution).not.toHaveText("");
});

for (const [id, name] of [["222", "2×2×2"], ["pyram", "Pyraminx"], ["skewb", "Skewb"], ["minx", "Megaminx"], ["333oh", "3×3 OH"], ["333fm", "3×3 FM"]] as const) {
  test(`${name}: nhóm Xáo trộn / Trạng thái có mặt và tô màu giải được`, async ({ page }) => {
    await signedOut(page);
    await page.goto("/");
    await page.getByLabel("Loại khối").click();
    await page.getByRole("option", { name }).click();
    await expect(page.getByRole("button", { name: "Xáo trộn" })).toBeVisible();
    await page.getByRole("button", { name: "Trạng thái cube" }).click();

    // Khối vừa mở là khối đã giải: lời giải rỗng.
    await expect(page.locator("[data-sticker]").first()).toBeVisible({ timeout: 60_000 });
    await page.getByRole("button", { name: "Tìm cách giải" }).click();
    await expect(page.getByTestId("other-puzzle-solution")).toBeVisible({ timeout: 120_000 });
    await expect(page.getByRole("alert")).toHaveCount(0);

    // Tô sai một sticker (đổi màu một ô) thì báo trạng thái không hợp lệ.
    const colors = page.getByRole("group", { name: "Bảng màu" }).getByRole("button");
    await colors.nth(1).click();
    await page.locator("[data-sticker^=\"CORNERS-l0\"]").first().click({ force: true });
    await page.getByRole("button", { name: "Tìm cách giải" }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 120_000 });
    void id;
  });
}
