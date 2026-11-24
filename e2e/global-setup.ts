import { chromium, type FullConfig } from "@playwright/test";

export default async function globalSetup(config: FullConfig) {
  const { baseURL, launchOptions } = config.projects[0]?.use ?? {};
  if (!baseURL) return;
  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage();
    for (const route of ["/", "/timer", "/study?lane=cfop", "/history", "/play"]) {
      await page.goto(new URL(route, baseURL).toString(), {
        timeout: 180_000,
        waitUntil: "load",
      });
      await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => undefined);
    }
  } finally {
    await browser.close();
  }
}
