import { expect, test } from "@playwright/test";

/**
 * Kịch bản e2e: nội dung không được tràn ra ngoài khối của nó.
 *
 * Lỗi thật: cỡ chữ dùng `vw` (theo bề rộng cửa sổ) nên đồng hồ trong một
 * cột hẹp tràn ra ngoài khối, và giá trị thời gian dài trong ô số liệu cũng
 * vậy. Bài test dựng sẵn dữ liệu có thời gian dài rồi đo từng phần tử.
 */

const LONG_SOLVES = Array.from({ length: 6 }, (_, index) => ({
  id: `overflow-${index}`,
  createdAt: Date.now() - index * 86_400_000,
  // 1:23:20 - thời gian dài hơn mọi giá trị thực tế.
  elapsedMs: 5_000_000 + index * 1_000,
  inspectionMs: 15_000,
  input: "R U R' U'",
  inputKind: "scramble",
  moves: 4,
  penalty: "none",
  solution: "R U R' U'",
  note: "",
  tags: [],
  phaseSplits: [],
}));

async function overflowingElements(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const found: { tag: string; cls: string; scroll: number; client: number; text: string }[] = [];
    for (const element of document.querySelectorAll("body *")) {
      if (element.scrollWidth <= element.clientWidth + 1 || element.clientWidth === 0) continue;
      const style = getComputedStyle(element);
      // Vùng cuộn có chủ đích thì được phép tràn.
      if (["auto", "scroll", "hidden"].includes(style.overflowX)) continue;
      found.push({
        tag: element.tagName,
        cls: element.className?.toString().slice(0, 70) ?? "",
        scroll: element.scrollWidth,
        client: element.clientWidth,
        text: (element.textContent ?? "").trim().slice(0, 30),
      });
    }
    return found;
  });
}

for (const route of ["/timer", "/study"]) {
  test(`${route} không tràn nội dung ra ngoài khối`, async ({ page }) => {
    await page.addInitScript(entries => {
      window.localStorage.setItem("cfop-solve-history-v1", JSON.stringify(entries));
    }, LONG_SOLVES);

    await page.goto(route);
    await page.waitForTimeout(2000);

    const overflowing = await overflowingElements(page);
    expect(
      overflowing,
      overflowing
        .map(item => `${item.tag} ${item.scroll}>${item.client} [${item.cls}] "${item.text}"`)
        .join("\n"),
    ).toEqual([]);
  });
}
