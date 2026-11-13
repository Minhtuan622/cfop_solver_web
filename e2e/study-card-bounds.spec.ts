import { expect, test } from "@playwright/test";

/**
 * Kịch bản e2e: card trên trang Học thêm không được tràn qua footer.
 *
 * Lỗi thật: các card giai đoạn trong BldStudyLab dùng `h-full` dù không phải
 * con đầu tiên của cột — `h-full` giải ra **chiều cao cả cột** (cột bị grid
 * kéo giãn) thay vì phần còn lại, nên card "01 · Định hướng" tràn qua footer
 * xuống đáy trang, kéo scrollHeight lên ~375px và để lại một cột trắng lớn
 * dưới footer (đo thật trên /study?lane=bld, 1920px).
 */

async function cardsBeyondFooter(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const footer = document.querySelector("footer");
    if (!footer) return [];
    const limit = footer.getBoundingClientRect().bottom + 2;
    const found: { cls: string; bottom: number; limit: number; text: string }[] = [];
    for (const element of document.querySelectorAll("main .bg-surface")) {
      const bottom = element.getBoundingClientRect().bottom + scrollY;
      if (bottom > limit) {
        found.push({
          cls: element.className.toString().slice(0, 60),
          bottom: Math.round(bottom),
          limit: Math.round(limit),
          text: (element.textContent ?? "").trim().slice(0, 30),
        });
      }
    }
    return found;
  });
}

test("/study?lane=bld không có card tràn qua footer", async ({ page }) => {
  await page.goto("/study?lane=bld");
  await page.waitForTimeout(2500);

  const beyond = await cardsBeyondFooter(page);
  expect(
    beyond,
    beyond
      .map(item => `bottom ${item.bottom} > ${item.limit} [${item.cls}] "${item.text}"`)
      .join("\n"),
  ).toEqual([]);
});

test("/study card Lịch ôn ôm nội dung, không bị kéo giãn đáy trống", async ({ page }) => {
  await page.goto("/study");
  await page.waitForTimeout(2500);

  const slack = await page.evaluate(() => {
    const aside = document.querySelector<HTMLElement>("main aside.rounded-card");
    if (!aside) return null;
    const inner = aside.firstElementChild as HTMLElement | null;
    if (!inner) return null;
    // Card không có padding riêng nên chiều cao card phải bằng khối nội dung
    // bên trong. Khi còn `h-full` (kéo giãn theo card "Case đang học"), lệch
    // là ~330px trên màn 1920.
    return Math.round(aside.clientHeight - inner.clientHeight);
  });
  expect(slack).not.toBeNull();
  expect(slack).toBeLessThanOrEqual(8);
});
