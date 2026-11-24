import { expect, test, type Page } from "@playwright/test";

test.setTimeout(60_000);

const TWISTY_PATTERN = "**/*twisty*";
const DYNAMIC_3D_PATTERN = "**/twisty-dynamic-3d-*.js*";
const RELOAD_FLAG = "cfop-3d-preview-reload";
const PAGE_MARKER = "__cfopE2EPageMarker";

type Observed3DState = {
  marker: string | null;
  hasCanvas: boolean;
  errorCard: boolean;
};

function read3DState(page: Page) {
  return page.evaluate<Observed3DState, string>(markerName => {
    const host = Array.from(document.querySelectorAll("[aria-label]")).find(
      node => /Mô hình/.test(node.getAttribute("aria-label") ?? "")
    );
    const marker = (window as unknown as Record<string, unknown>)[markerName];
    return {
      marker: typeof marker === "string" ? marker : null,
      hasCanvas: Boolean(host?.querySelector("canvas")),
      errorCard: Array.from(document.querySelectorAll("p")).some(node =>
        /Không thể tạo mô hình 3D/i.test(node.textContent ?? "")
      ),
    };
  }, PAGE_MARKER);
}

async function observe3D(
  page: Page,
  timeoutMs: number,
  options: { expectedMarker: string | null; untilReloaded?: boolean }
) {
  const deadline = Date.now() + timeoutMs;
  let reloaded = false;
  for (;;) {
    try {
      const state = await read3DState(page);
      if (state.marker !== options.expectedMarker) reloaded = true;
      if (state.hasCanvas || state.errorCard) {
        if (!options.untilReloaded || reloaded) return { ...state, reloaded };
      }
    } catch {
    }
    if (Date.now() > deadline)
      throw new Error("hết thời gian chờ trạng thái 3D của preview");
    await page.waitForTimeout(400);
  }
}

test("hỏng tải chunk một lần thì card lỗi có nút Thử lại, nạp lại trang phục hồi được", async ({
  page,
}) => {
  let failures = 0;
  await page.route(TWISTY_PATTERN, route => {
    if (failures++ === 0) return route.abort();
    return route.continue();
  });

  await page.goto("/timer");
  await page.evaluate(marker => {
    (window as unknown as Record<string, unknown>)[marker] = "doc1";
  }, PAGE_MARKER);

  const failed = await observe3D(page, 30_000, { expectedMarker: "doc1" });
  expect(failed.errorCard, "phải hiện card lỗi khi chunk tải hỏng").toBe(true);
  expect(failed.hasCanvas).toBe(false);

  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  const recovered = await observe3D(page, 30_000, {
    expectedMarker: "doc1",
    untilReloaded: true,
  });
  expect(
    recovered.reloaded,
    "nút Thử lại phải nạp lại trang để xoá cache module map"
  ).toBe(true);
  expect(
    recovered.hasCanvas,
    "canvas 3D phải dựng lại được sau khi nạp lại"
  ).toBe(true);
  expect(
    await page.evaluate(
      flag => window.sessionStorage.getItem(flag),
      RELOAD_FLAG
    )
  ).toBeNull();
});

test("hỏng dai dẳng thì nạp lại đúng một lần, không lặp vô hạn", async ({
  page,
}) => {
  await page.route(TWISTY_PATTERN, route => route.abort());

  await page.goto("/timer");
  await page.evaluate(marker => {
    (window as unknown as Record<string, unknown>)[marker] = "doc1";
  }, PAGE_MARKER);
  const firstFailure = await observe3D(page, 30_000, {
    expectedMarker: "doc1",
  });
  expect(firstFailure.errorCard).toBe(true);

  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  const afterReload = await observe3D(page, 30_000, {
    expectedMarker: "doc1",
    untilReloaded: true,
  });
  expect(afterReload.reloaded, "lần bấm đầu phải nạp lại trang").toBe(true);
  expect(afterReload.errorCard, "vẫn hỏng vì chunk vẫn bị chặn").toBe(true);

  await page.evaluate(marker => {
    (window as unknown as Record<string, unknown>)[marker] = "doc2";
  }, PAGE_MARKER);
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  const secondAttempt = await observe3D(page, 20_000, {
    expectedMarker: "doc2",
  });
  expect(
    secondAttempt.marker,
    "lần bấm sau không được nạp lại trang (chống vòng lặp)"
  ).toBe("doc2");
  expect(secondAttempt.errorCard, "vẫn hiện card lỗi khi chunk vẫn hỏng").toBe(
    true
  );
});

test("chunk chỉ chậm thì tự thử lại trong trang, không hiện card lỗi", async ({
  page,
}) => {
  let delayed = 0;
  await page.route(DYNAMIC_3D_PATTERN, async route => {
    if (delayed++ === 0) {
      await new Promise(resolve => setTimeout(resolve, 8_500));
    }
    await route.continue();
  });

  await page.goto("/timer");
  const outcome = await observe3D(page, 30_000, { expectedMarker: null });
  expect(outcome.hasCanvas, "canvas 3D phải xuất hiện sau khi tự thử lại").toBe(
    true
  );
  expect(outcome.errorCard, "không được hiện card lỗi cho lỗi tạm thời").toBe(
    false
  );
});
