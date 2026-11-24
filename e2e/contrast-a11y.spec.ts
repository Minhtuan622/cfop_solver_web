import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Route } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type Theme = "light" | "dark";
type Finding = {
  page: string;
  theme: Theme;
  rule: string;
  impact: string | null;
  target: string;
  html: string;
  failureSummary: string;
};

const PAGES = [
  { name: "trang chủ", path: "/" },
  { name: "bấm giờ", path: "/timer" },
  { name: "lịch sử", path: "/history" },
  { name: "phòng thi", path: "/rooms" },
  { name: "hồ sơ", path: "/profile" },
  { name: "cài đặt", path: "/settings" },
];

const THEMES: Theme[] = ["light", "dark"];

const BASELINE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "contrast-a11y.baseline.json"
);
let baselineKeys: string[] = [];
try {
  const parsed = JSON.parse(readFileSync(BASELINE_PATH, "utf8")) as {
    keys?: string[];
    findings?: Array<{ page: string; theme: Theme; rule: string; target: string }>;
  };
  if (Array.isArray(parsed.keys)) {
    baselineKeys = parsed.keys;
  } else if (Array.isArray(parsed.findings)) {
    baselineKeys = parsed.findings.map(f =>
      [f.page, f.theme, f.rule, "", ""].join("|")
    );
  }
} catch {
  baselineKeys = [];
}
const KNOWN_COUNTS = new Map<string, number>();
for (const key of baselineKeys) {
  KNOWN_COUNTS.set(key, (KNOWN_COUNTS.get(key) ?? 0) + 1);
}

const COLLECTED: Finding[] = [];

function normalizeHtml(html: string): string {
  return html.replace(/\s*data-loc="[^"]*"/g, "").replace(/\s+/g, " ").trim();
}

function findingKey(finding: Finding): string {
  return [
    finding.page,
    finding.theme,
    finding.rule,
    normalizeHtml(finding.html),
    finding.failureSummary,
  ].join("|");
}

function shortKey(key: string): string {
  return key.split("|").slice(0, 3).join(" | ");
}

function trpcBatch(dataFor: (path: string) => unknown) {
  return async (route: Route) => {
    const url = new URL(route.request().url());
    const rawPaths = decodeURIComponent(
      url.pathname.replace("/api/trpc/", "")
    ).split(",");
    const results = rawPaths.map(path => ({
      result: { data: { json: dataFor(path) } },
    }));
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(results),
    });
  };
}

async function mockApi(page: Page) {
  const account = {
    id: 901,
    email: "axe.audit@example.test",
    displayName: "Axe Audit",
    bio: "Tài khoản giả lập cho bài quét tương phản.",
    avatarUrl: "",
    goalMs: null,
    wcaId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    lastSignedIn: "2026-01-01T00:00:00.000Z",
  };

  await page.route(
    "**/api/trpc/**",
    trpcBatch(path => {
      if (path === "cfopAccount.me") return account;
      if (path === "cfopAccount.cloudState.get") {
        return {
          payload: null,
          updatedAt: "2026-01-01T00:00:00.000Z",
          revision: 1,
        };
      }
      if (path === "cfopAccount.cloudState.save") {
        return { updatedAt: "2026-01-01T00:00:00.000Z", revision: 2 };
      }
      if (path === "cfopAccount.storageStatus") return { enabled: false };
      if (path === "cfopAccount.wca.oauthStatus") return { configured: false };
      if (path === "competition.listMine") return [];
      return null;
    })
  );
}

async function openPage(page: Page, path: string, theme: Theme) {
  await page.addInitScript(
    ({ theme }) => {
      window.localStorage.setItem("cfop-theme", theme);
      window.localStorage.setItem("cfop-language", "vi");
    },
    { theme }
  );
  await mockApi(page);
  await page.goto(path);
  await expect(page.locator("footer")).toContainText("CFOP Solver Studio");
  await expect(page.locator("main")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
}

async function scan(page: Page, path: string, theme: Theme) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  return results.violations.flatMap(violation =>
    violation.nodes.map(node => ({
      page: path,
      theme,
      rule: violation.id,
      impact: violation.impact ?? null,
      target: node.target.join(" >> "),
      html: node.html,
      failureSummary: node.failureSummary ?? "",
    }))
  );
}

function printFinding(finding: Finding, known: boolean) {
  console.log(
    `[axe] ${known ? "DA-BIET" : "MOI"} | ${finding.page} | ${finding.theme} | ` +
      `${finding.rule} | ${finding.impact ?? "n/a"} | ${finding.target}`
  );
  console.log(`       html: ${finding.html}`);
  console.log(`       ${finding.failureSummary.replace(/\n/g, " | ")}`);
}

for (const theme of THEMES) {
  test.describe(`axe — chế độ ${theme}`, () => {
    for (const appPage of PAGES) {
      test(`${appPage.name} (${appPage.path})`, async ({ page }, testInfo) => {
        await openPage(page, appPage.path, theme);
        const findings = await scan(page, appPage.path, theme);

        const known: Finding[] = [];
        const fresh: Finding[] = [];
        const seenCounts = new Map<string, number>();
        for (const finding of findings) {
          const key = findingKey(finding);
          const seen = seenCounts.get(key) ?? 0;
          const baseline = KNOWN_COUNTS.get(key) ?? 0;
          if (seen < baseline) {
            known.push(finding);
          } else {
            fresh.push(finding);
          }
          seenCounts.set(key, seen + 1);
        }

        const missing: string[] = [];
        for (const [key, count] of KNOWN_COUNTS) {
          if (!key.startsWith(`${appPage.path}|${theme}|`)) continue;
          if ((seenCounts.get(key) ?? 0) < count) missing.push(key);
        }

        for (const finding of findings) {
          printFinding(finding, known.includes(finding));
        }
        console.log(
          `[axe] tổng kết ${appPage.path} (${theme}): ` +
            `${findings.length} vi phạm, ${known.length} đã biết, ${fresh.length} mới, ` +
            `${missing.length} đã biết nhưng không còn xuất hiện`
        );

        await testInfo.attach(`axe-${theme}-${appPage.path.replace(/\W+/g, "_")}.json`, {
          body: JSON.stringify({ page: appPage.path, theme, findings }, null, 2),
          contentType: "application/json",
        });

        if (process.env.AXE_UPDATE_BASELINE === "1") {
          COLLECTED.push(...findings);
        }

        if (process.env.AXE_REPORT_ONLY !== "1" && process.env.AXE_UPDATE_BASELINE !== "1") {
          expect(
            fresh,
            `Phát hiện axe MỚI (chưa có trong baseline):\n` +
              fresh
                .map(item => `${item.rule} ${item.target} — ${item.failureSummary}`)
                .join("\n")
          ).toEqual([]);
          expect(
            missing.map(shortKey),
            `Phát hiện axe đã được SỬA nhưng chưa gỡ khỏi baseline:\n` +
              `Sửa xong thì chạy lại:\n` +
              `  AXE_UPDATE_BASELINE=1 pnpm exec playwright test e2e/contrast-a11y.spec.ts`
          ).toEqual([]);
        }
      });
    }
  });
}

test.afterAll(() => {
  if (process.env.AXE_UPDATE_BASELINE !== "1") return;
  const payload = {
    version: 4,
    generated: new Date().toISOString(),
    note:
      "Khoa (key) nhan dien vi pham axe hien co tren 6 trang x 2 che do, " +
      "giu nguyen so lan xuat hien. Bai kiem tra bao ve baseline theo hai " +
      "chieu: vi pham MOI (khong co trong danh sach nay) lam test that bai, " +
      "va vi pham DA BIET NHUNG KHONG CON xuat hien (da duoc sua) cung lam " +
      "test that bai — danh sach phai luon trung thuc. Muc dich bao cao, " +
      "khong tu sua mau.",
    keys: COLLECTED.map(findingKey),
    findings: Array.from(
      new Map(COLLECTED.map(f => [findingKey(f), f])).values()
    ).map(({ page, theme, rule, target }) => ({
      page,
      theme,
      rule,
      target,
    })),
  };
  writeFileSync(BASELINE_PATH, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`[axe] wrote baseline with ${COLLECTED.length} findings`);
});
