import { expect, test, type Page, type Route } from "@playwright/test";

const LONG_SOLVES = Array.from({ length: 8 }, (_, index) => ({
  id: `overflow-${index}`,
  createdAt: Date.now() - index * 86_400_000,
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

async function overflowingElements(page: Page) {
  return page.evaluate(() => {
    const found: { tag: string; cls: string; scroll: number; client: number; text: string }[] = [];
    for (const element of document.querySelectorAll("body *")) {
      if (element.scrollWidth <= element.clientWidth + 2 || element.clientWidth === 0) continue;
      const style = getComputedStyle(element);
      if (["auto", "scroll", "hidden", "clip"].includes(style.overflowX)) continue;
      if (element.closest("[data-sonner-toaster]")) continue;
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

async function mockSignedInAccount(page: Page) {
  const account = {
    id: 901,
    email: "e2e.overflow@example.test",
    displayName: "E2E Overflow",
    bio: "",
    avatarUrl: "",
    goalMs: null,
    wcaId: null,
    createdAt: "2026-08-27T00:00:00.000Z",
    lastSignedIn: "2026-08-27T00:00:00.000Z",
  };

  await page.route("**/api/trpc/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const paths = decodeURIComponent(url.pathname.replace("/api/trpc/", "")).split(",");
    const resultFor = (path: string): unknown => {
      if (path === "cfopAccount.me") return account;
      if (path === "cfopAccount.cloudState.get") return null;
      if (path === "cfopAccount.wca.oauthStatus") return { configured: false };
      return null;
    };
    const results = paths.map(path => ({ result: { data: { json: resultFor(path) } } }));
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(results),
    });
  });
}

for (const route of ["/timer", "/study", "/history"]) {
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

test("/profile không tràn nội dung ra ngoài khối", async ({ page }) => {
  await mockSignedInAccount(page);
  await page.addInitScript(entries => {
    window.localStorage.setItem("cfop-solve-history-v1", JSON.stringify(entries));
  }, LONG_SOLVES);

  await page.goto("/profile");
  await page.waitForTimeout(2500);

  const overflowing = await overflowingElements(page);
  expect(
    overflowing,
    overflowing
      .map(item => `${item.tag} ${item.scroll}>${item.client} [${item.cls}] "${item.text}"`)
      .join("\n"),
  ).toEqual([]);
});
