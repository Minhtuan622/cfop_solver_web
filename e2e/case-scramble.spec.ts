import { expect, test, type Page } from "@playwright/test";

/**
 * Luyện case trong Học thêm: mỗi case hiện scramble thật (nghịch đảo thuật
 * toán) để cầm khối luyện, có thể thêm AUF ngẫu nhiên và mở thẳng trong Timer.
 */
async function signedOut(page: Page) {
  await page.route("**/api/trpc/cfopAccount.me**", route =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: null } } }]),
    })
  );
}

test("lane Roux: case có scramble thật và mở được trong Timer", async ({ page }) => {
  await signedOut(page);
  await page.goto("/study?lane=roux");
  const text = page.getByTestId("case-scramble-text");
  await expect(text).toBeVisible({ timeout: 30_000 });
  const scramble = ((await text.textContent()) ?? "").trim();
  expect(scramble).toMatch(/^[A-Za-z0-9'\s]+$/);

  // AUF ngẫu nhiên chỉ thêm U / U2 / U' ở hai đầu, phần giữa giữ nguyên.
  await page.getByRole("button", { name: "AUF ngẫu nhiên" }).click();
  const withAuf = ((await text.textContent()) ?? "").trim();
  expect(withAuf).toContain(scramble);
  await page.getByRole("button", { name: "AUF ngẫu nhiên" }).click();

  await page.getByRole("button", { name: "Mở trong Timer" }).click();
  await expect(page).toHaveURL(/\/timer\?event=333&scramble=/);
  await expect(page.getByText(scramble, { exact: false }).first()).toBeVisible({ timeout: 30_000 });
});

test("lane 2×2: cũng có scramble của case", async ({ page }) => {
  await signedOut(page);
  await page.goto("/study?lane=twoByTwo");
  await expect(page.getByTestId("case-scramble-text")).toBeVisible({ timeout: 30_000 });
});

test("Timer bỏ qua link scramble sai", async ({ page }) => {
  await signedOut(page);
  await page.goto("/timer?event=333&scramble=" + encodeURIComponent("<script>alert(1)</script>"));
  await expect(page.getByText("<script>")).toHaveCount(0);
});
