import { expect, test, type Page } from "@playwright/test";

const account = {
  id: 701,
  email: "e2e.cuber@example.test",
  displayName: "E2E Cuber",
  bio: "",
  avatarUrl: "",
  goalMs: null,
  wcaId: null,
  createdAt: "2026-08-27T00:00:00.000Z",
  lastSignedIn: "2026-08-27T00:00:00.000Z",
};

function mockAccount(page: Page) {
  page.route("**/api/trpc/cfopAccount.me**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: account } } }]),
    }),
  );
}

test("hai thiết bị đăng nhập cùng tài khoản", async ({ browser }) => {
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  mockAccount(pageA);
  await pageA.goto("/profile");
  await expect(pageA.getByText("E2E Cuber")).toBeVisible();

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  mockAccount(pageB);
  await pageB.goto("/profile");
  await expect(pageB.getByText("E2E Cuber")).toBeVisible();

  await contextA.close();
  await contextB.close();
});
