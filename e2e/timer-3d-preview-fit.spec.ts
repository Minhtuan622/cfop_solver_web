import { expect, test, type Locator } from "@playwright/test";

/**
 * Kịch bản e2e: mô hình 3D trên trang Bấm giờ phải lấp đầy khung xem và cuộn
 * chuột phải cuộn trang, không thu phóng mô hình.
 *
 * Lỗi thật: khung xem chỉ cao 220px trong khi thẻ cao hơn, còn camera giữ
 * khoảng cách cố định nên khối chỉ chiếm ~37% chiều rộng; con lăn chuột lại
 * bị chặn để zoom nên người dùng desktop không cuộn trang được khi trỏ vào
 * mô hình.
 */

async function previewFill(host: Locator) {
  return host.evaluate(node => {
    const canvas = node.querySelector("canvas");
    if (!canvas) return null;
    const copy = document.createElement("canvas");
    copy.width = canvas.width;
    copy.height = canvas.height;
    const copyContext = copy.getContext("2d");
    if (!copyContext) return null;
    copyContext.drawImage(canvas, 0, 0);
    const { data } = copyContext.getImageData(0, 0, copy.width, copy.height);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < copy.height; y += 1) {
      for (let x = 0; x < copy.width; x += 1) {
        if (data[(y * copy.width + x) * 4 + 3] > 8) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    return {
      width: (maxX - minX + 1) / copy.width,
      height: (maxY - minY + 1) / copy.height,
    };
  });
}

test("mô hình 3D trên Timer lấp đầy khung và cuộn chuột không thu phóng", async ({
  page,
}) => {
  await page.goto("/timer");
  const host = page.getByRole("img", { name: "Mô hình 3×3×3 3D" });
  await expect(host).toBeVisible({ timeout: 45_000 });
  await expect(host.locator("canvas")).toBeVisible({ timeout: 45_000 });

  // Canvas phải phủ gần kín phần nội dung của thẻ, không còn cao 220px cố định.
  const boxes = await host.evaluate(node => {
    const card = node.closest(".rounded-card");
    if (!card) return null;
    const hostBox = node.getBoundingClientRect();
    const cardBox = card.getBoundingClientRect();
    return {
      hostWidth: hostBox.width,
      hostHeight: hostBox.height,
      cardWidth: cardBox.width,
      cardHeight: cardBox.height,
    };
  });
  expect(boxes).not.toBeNull();
  expect(boxes!.hostWidth).toBeGreaterThan(boxes!.cardWidth - 24);
  expect(boxes!.hostHeight).toBeGreaterThan(boxes!.cardHeight - 24);

  // Đo pixel thật: khối phải chiếm phần lớn khung, không còn ~37% như trước.
  await expect
    .poll(async () => (await previewFill(host))?.width ?? 0, {
      timeout: 45_000,
    })
    .toBeGreaterThan(0.6);
  const beforeWheel = await previewFill(host);
  expect(beforeWheel!.height).toBeGreaterThan(0.6);

  // Con lăn trên mô hình phải cuộn trang và giữ nguyên tỉ lệ khối (không zoom).
  await page.evaluate(() => window.scrollTo(0, 0));
  const box = await host.boundingBox();
  expect(box).not.toBeNull();
  const beforeScroll = await page.evaluate(() => window.scrollY);
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(400);
  const afterScroll = await page.evaluate(() => window.scrollY);
  expect(afterScroll).toBeGreaterThan(beforeScroll);

  const afterWheel = await previewFill(host);
  expect(afterWheel).not.toBeNull();
  expect(Math.abs(afterWheel!.width - beforeWheel!.width)).toBeLessThan(0.05);
  expect(Math.abs(afterWheel!.height - beforeWheel!.height)).toBeLessThan(0.05);
});
