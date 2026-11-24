import { expect, test } from "@playwright/test";

/**
 * Kịch bản e2e: các khối trong panel nhập scramble phải có khoảng cách thật,
 * không dính vào nhau.
 *
 * Lỗi thật: panel BUFFER sát ô scramble (0px), hàng link phụ chỉ cách 8px, và
 * nội dung mục gập dính ngay dưới dòng tiêu đề (0px).
 */
test("panel nhập scramble không dính các khối", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Loại khối").click();
  await page.getByRole("option", { name: "3×3 BLD" }).click();

  const banner = page
    .locator("div.rounded-panel", { hasText: "BUFFER / UF (C)" })
    .first();
  const input = page.locator("#home-scramble");
  const bannerBox = await banner.boundingBox();
  const inputBox = await input.boundingBox();
  expect(bannerBox).not.toBeNull();
  expect(inputBox).not.toBeNull();
  expect(inputBox!.y - (bannerBox!.y + bannerBox!.height)).toBeGreaterThanOrEqual(
    16
  );

  const links = page.getByText("Scramble ngẫu nhiên", { exact: true });
  const linksBox = await links.boundingBox();
  expect(linksBox).not.toBeNull();
  expect(linksBox!.y - (inputBox!.y + inputBox!.height)).toBeGreaterThanOrEqual(
    12
  );

  // Mục gập trong panel (dùng chung `SolverDetails`): nội dung phải cách
  // dòng tiêu đề ít nhất 8px. Quét camera nay là hộp thoại riêng, nên kiểm
  // mục "Dán chuỗi 54 sticker" của chế độ nhập trạng thái.
  await page.getByRole("button", { name: "Trạng thái cube" }).click();
  await page.getByText("Dán chuỗi 54 sticker").click();
  const gap = await page
    .locator("details", { hasText: "Dán chuỗi 54 sticker" })
    .first()
    .evaluate(element => {
      const summary = element.querySelector("summary");
      const content = summary?.nextElementSibling;
      const firstChild = content?.firstElementChild ?? content;
      if (!summary || !firstChild) return -1;
      return (
        firstChild.getBoundingClientRect().top -
        summary.getBoundingClientRect().bottom
      );
    });
  expect(gap).toBeGreaterThanOrEqual(8);
});
