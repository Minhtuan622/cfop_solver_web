import { expect, test, type Page } from "@playwright/test";

const SOLUTION = "R U R' U R U2 R'";
const ENTRY = {
  id: "analysis-fixture",
  createdAt: Date.now(),
  elapsedMs: 3_000,
  inspectionMs: 0,
  input: "R U2 R' U' R U' R'",
  inputKind: "scramble",
  moves: 7,
  penalty: "none",
  solution: SOLUTION,
  moveTimes: [0, 150, 300, 450, 2_000, 2_150, 3_000],
  note: "",
  tags: [],
  phaseSplits: [
    { phase: "Cross", markedAtMs: 0, elapsedMs: 0 },
    { phase: "F2L", markedAtMs: 0, elapsedMs: 0 },
    { phase: "OLL", markedAtMs: 3_000, elapsedMs: 3_000 },
    { phase: "PLL", markedAtMs: 3_000, elapsedMs: 0 },
  ],
  eventId: "333",
  source: "smartcube",
};

async function seed(page: Page, entry: unknown) {
  await page.route("**/api/trpc/cfopAccount.me**", route =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: null } } }]),
    })
  );
  await page.addInitScript(value => {
    localStorage.setItem("cfop-solve-history-v1", JSON.stringify([value]));
    localStorage.setItem("cfop-timer-event", "333");
  }, entry);
}

async function openAnalysis(page: Page) {
  await page.goto("/timer");
  await page.getByRole("button", { name: /^PB/ }).click();
  await page.getByRole("button", { name: "Phân tích sâu" }).click();
}

test("mở phân tích: bảng giai đoạn, quãng dừng và case OLL", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(String(error).slice(0, 200)));
  await seed(page, ENTRY);
  await openAnalysis(page);

  const phases = page.getByTestId("analysis-phases");
  await expect(phases).toBeVisible({ timeout: 30_000 });
  // 1 hàng tiêu đề + 4 giai đoạn (Cross, F2L, OLL, PLL) + 4 hàng cặp F2L.
  await expect(phases.getByRole("row")).toHaveCount(9);
  await expect(page.getByTestId("analysis-pauses")).toContainText("1.55s");
  await expect(page.getByRole("link", { name: "Luyện case" }).first()).toHaveAttribute(
    "href",
    /\/study\?lane=cfop&case=OLL-(26|27)$/,
    { timeout: 30_000 }
  );
  expect(errors).toEqual([]);
});

test("so với bộ giải chạy bộ giải thật và hiện bảng chênh lệch", async ({ page }) => {
  await seed(page, ENTRY);
  await openAnalysis(page);
  await page.getByRole("button", { name: "So với bộ giải" }).click();
  const table = page.getByTestId("analysis-comparison");
  await expect(table).toBeVisible({ timeout: 120_000 });
  await expect(table.getByRole("row")).toHaveCount(6);
});

test("phát lại đúng nhịp chạy hết lời giải", async ({ page }) => {
  await seed(page, ENTRY);
  await openAnalysis(page);
  await expect(page.getByTestId("analysis-phases")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: /^(Phát|Play)/ }).first().click();
  await expect(page.getByText(/07 \/ 07/)).toBeVisible({ timeout: 30_000 });
});

test("solve không có nhịp từng nước không có nút phân tích", async ({ page }) => {
  await seed(page, { ...ENTRY, moveTimes: undefined, source: "manual" });
  await page.goto("/timer");
  await page.getByRole("button", { name: /^PB/ }).click();
  await expect(page.getByRole("button", { name: "Phân tích sâu" })).toHaveCount(0);
});
