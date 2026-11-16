import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

/**
 * Chụp ảnh màn hình cho README.
 *
 * Chạy với dev server đang bật:
 *   node scripts/capture-screenshots.mjs
 *
 * Ảnh được ghi vào docs/screenshots/ và README.md tham chiếu tới chúng.
 *
 * Hai lưu ý chất lượng ảnh:
 * - Trang Kết quả dùng dữ liệu mẫu (localStorage) để ảnh thể hiện được cả
 *   chỉ số, biểu đồ xu hướng và danh sách lượt giải — đúng như ảnh chụp thực
 *   tế sau khi người dùng đã bấm giờ kết quả.
 * - Các trang cần chờ tải nội dung (vd: Học thêm nạp catalog) dùng
 *   `waitForText`; nếu không có, ảnh sẽ ghi lại trạng thái "đang tải…".
 */
const BASE = process.env.SCREENSHOT_BASE_URL || "http://127.0.0.1:3000";
const OUT = "docs/screenshots";

/**
 * Dữ liệu mẫu demo cho trang Kết quả: 8 lượt giải 3×3 với times thực tế,
 * tạo trong ~2 tuần gần nhất, mỗi lượt có phase splits đầy đủ.
 */
const DEMO_SOLVES = Array.from({ length: 8 }, (_, index) => {
  const daysAgo = index * 2 + 1;
  const times = [9_842, 11_204, 10_517, 13_388, 9_960, 8_735, 12_460, 10_521];
  const splits = [
    { phase: "Cross", markedAtMs: 1_800 + index * 140, elapsedMs: 1_800 + index * 140 },
    { phase: "F2L", markedAtMs: 6_200 + index * 260, elapsedMs: 4_400 + index * 120 },
    { phase: "OLL", markedAtMs: 8_400 + index * 220, elapsedMs: 2_200 + index * 60 },
    { phase: "PLL", markedAtMs: 9_600 + index * 180, elapsedMs: 1_200 + index * 40 },
  ];
  return {
    id: `demo-solve-${index + 1}`,
    createdAt: Date.now() - daysAgo * 86_400_000 - index * 3_600_000,
    elapsedMs: times[index],
    inspectionMs: 15_000,
    input: "R U R' U' F2 B2 L F' D2 B L' D' R2 B2 U2 U' R' B2 L2",
    inputKind: "scramble",
    moves: 46 + (index % 5),
    penalty: index === 3 ? "+2" : "none",
    solution: "x2 D' L F2 D' L' B D2 U' R B2 U L D2 B2 D F",
    note: index === 2 ? "PB buổi sáng" : "",
    tags: index === 1 ? ["buổi sáng"] : [],
    phaseSplits: splits,
    eventId: "555",
  };
});

const PAGES = [
  { file: "home.png", path: "/" },
  { file: "timer.png", path: "/timer" },
  { file: "results.png", path: "/history", seed: DEMO_SOLVES },
  { file: "study.png", path: "/study", waitForText: "CASE ĐANG HỌC" },
  { file: "settings.png", path: "/settings" },
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

/** Tài khoản giả để các trang cần đăng nhập vẫn render được. */
function mockAccount(target) {
  return target.route("**/api/trpc/cfopAccount.me**", route =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          result: {
            data: {
              json: {
                id: 1,
                email: "demo@example.test",
                displayName: "Nguyễn Minh Tuấn",
                bio: "CFOP speedcuber",
                avatarUrl: "",
                goalMs: null,
                wcaId: null,
                createdAt: "2026-01-01T00:00:00.000Z",
                lastSignedIn: "2026-01-01T00:00:00.000Z",
              },
            },
          },
        },
      ]),
    }),
  );
}

const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

// Tài khoản giả để các trang cần đăng nhập vẫn render được.
await mockAccount(page);

for (const item of PAGES) {
  if (item.seed) {
    await page.addInitScript(entries => {
      window.localStorage.setItem(
        "cfop-solve-history-v1",
        JSON.stringify(entries)
      );
    }, item.seed);
  }
  await page.goto(`${BASE}${item.path}`, { waitUntil: "domcontentloaded" });
  if (item.waitForText) {
    await page
      .getByText(item.waitForText, { exact: false })
      .first()
      .waitFor({ timeout: 20_000 })
      .catch(() => console.warn(`⚠ ${item.path}: không thấy "${item.waitForText}", vẫn chụp ảnh`));
  } else {
    await page.waitForTimeout(1_800);
  }
  await page.screenshot({ path: `${OUT}/${item.file}`, fullPage: false });
  console.log(`✓ ${OUT}/${item.file}`);
}

/* ---- Trang lời giải: gõ scramble, bấm giải, chờ bảng tổng kết ---- */
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.locator("#home-scramble").fill(
  "R2 B2 U2 F2 R2 B2 L' U2 L D2 L' B2 F U B R2 U2 B2 R' D2"
);
await page.getByRole("button", { name: /Tìm cách giải/ }).click();
await page.getByText(/^\d+ nước · \d+ bước$/).first().waitFor({
  timeout: 180_000,
});
await page.waitForTimeout(1_000);
await page.screenshot({ path: `${OUT}/solver-solution.png`, fullPage: false });
console.log(`✓ ${OUT}/solver-solution.png`);

/* ---- Chế độ tối (desktop): data-theme="dark" từ localStorage cfop-theme ---- */
const darkContext = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: "dark",
});
await darkContext.addInitScript(() => {
  window.localStorage.setItem("cfop-theme", "dark");
});
for (const item of [
  { file: "home-dark.png", path: "/" },
  { file: "timer-dark.png", path: "/timer" },
]) {
  const darkPage = await darkContext.newPage();
  await mockAccount(darkPage);
  await darkPage.goto(`${BASE}${item.path}`, { waitUntil: "domcontentloaded" });
  await darkPage.waitForTimeout(2_500);
  await darkPage.screenshot({ path: `${OUT}/${item.file}`, fullPage: false });
  console.log(`✓ ${OUT}/${item.file}`);
  await darkPage.close();
}
await darkContext.close();

/* ---- Giao diện mobile (390px) ---- */
const mobileContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
for (const item of [
  { file: "home-mobile.png", path: "/" },
  { file: "timer-mobile.png", path: "/timer" },
]) {
  const mobilePage = await mobileContext.newPage();
  await mockAccount(mobilePage);
  await mobilePage.goto(`${BASE}${item.path}`, { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(2_500);
  await mobilePage.screenshot({ path: `${OUT}/${item.file}`, fullPage: false });
  console.log(`✓ ${OUT}/${item.file}`);
  await mobilePage.close();
}
await mobileContext.close();

await browser.close();
