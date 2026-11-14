import { expect, test } from "@playwright/test";

/**
 * Kịch bản e2e: các khối trong panel nhập scramble phải có khoảng cách thật,
 * không dính vào nhau.
 *
 * Lỗi thật: panel BUFFER sát ô scramble (0px), hàng link phụ chỉ cách 8px, và
 * nội dung accordion camera dính ngay dưới dòng tiêu đề (0px).
 */
test("panel nhập scramble không dính các khối", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "3×3 BLD" }).click();

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

  // Mở accordion camera: nội dung phải cách dòng tiêu đề ít nhất 8px.
  await page.getByText("Quét camera · tùy chọn").click();
  const gap = await page
    .locator("details", { hasText: "Quét camera" })
    .first()
    .evaluate(element => {
      const summary = element.querySelector("summary");
      const content = summary?.nextElementSibling;
      const firstChild = content?.firstElementChild;
      if (!summary || !firstChild) return -1;
      return (
        firstChild.getBoundingClientRect().top -
        summary.getBoundingClientRect().bottom
      );
    });
  expect(gap).toBeGreaterThanOrEqual(8);
});
