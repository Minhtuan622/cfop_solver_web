import { expect, test } from "@playwright/test";

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
  await page.locator("main aside.rounded-card").first().waitFor();

  const slack = await page.evaluate(() => {
    const aside = document.querySelector<HTMLElement>("main aside.rounded-card");
    if (!aside) return null;
    const inner = aside.firstElementChild as HTMLElement | null;
    if (!inner) return null;
    return Math.round(aside.clientHeight - inner.clientHeight);
  });
  expect(slack).not.toBeNull();
  expect(slack).toBeLessThanOrEqual(8);
});
