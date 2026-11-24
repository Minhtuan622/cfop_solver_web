import { expect, test, type Page } from "@playwright/test";

async function signedOut(page: Page) {
  await page.route("**/api/trpc/cfopAccount.me**", route =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: null } } }]),
    })
  );
}

test("mở link 2×2 thì điền scramble và tự giải", async ({ page }) => {
  await signedOut(page);
  await page.goto("/?k=222&s=" + encodeURIComponent("R U R' U' F2 R"));
  await expect(page.locator("#home-scramble")).toHaveValue("R U R' U' F2 R");
  await expect(page.getByTestId("other-puzzle-solution")).toBeVisible({ timeout: 120_000 });
});

test("mở link Clock thì tự giải", async ({ page }) => {
  await signedOut(page);
  await page.goto("/?k=clock&s=" + encodeURIComponent("UR3+ DR2- y2 U1+ ALL2-"));
  await expect(page.getByTestId("other-puzzle-solution")).toBeVisible({ timeout: 120_000 });
});

test("mở link 3×3 CFOP thì tự giải không cần bấm", async ({ page }) => {
  await signedOut(page);
  await page.goto("/?k=cfop&s=" + encodeURIComponent("R U R' U'"));
  await expect(page.locator("#home-scramble")).toHaveValue("R U R' U'");
  await expect(page.getByText(/^\d+ nước · \d+ bước$/)).toBeVisible({ timeout: 180_000 });
});

test("nút Chia sẻ link dựng link của đầu vào hiện tại", async ({ page }) => {
  await signedOut(page);
  await page.goto("/");
  await page.locator("#home-scramble").fill("R U F2");
  const button = page.getByRole("button", { name: "Chia sẻ link" });
  await expect(button).toHaveAttribute("data-share-url", /\/\?k=cfop&s=R\+U\+F2$/);
  await page.getByLabel("Loại khối").click();
  await page.getByRole("option", { name: "Pyraminx" }).click();
  await expect(page.locator("#home-scramble")).not.toHaveValue("", { timeout: 30_000 });
  await expect(button).toHaveAttribute("data-share-url", /\/\?k=pyram&s=/);
});

test("link sai bị bỏ qua, trang vẫn dùng bình thường", async ({ page }) => {
  await signedOut(page);
  await page.goto("/?k=hack&s=" + encodeURIComponent("<script>"));
  await expect(page.locator("#home-scramble")).not.toHaveValue("<script>");
  await expect(page.getByRole("alert")).toHaveCount(0);
});
