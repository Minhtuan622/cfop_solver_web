import { expect, test, type Browser, type Page } from "@playwright/test";

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
  page.route("**/api/trpc/cfopAccount.me", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: account } } }]),
    }),
  );
}

/**
 * Kịch bản e2e: đăng nhập hai thiết bị cùng tài khoản.
 *
 * Kiểm tra hai thiết bị (hai ngữ cảnh trình duyệt độc lập) cùng đăng nhập
 * vào một tài khoản đều có thể xem hồ sơ (cfopAccount.me) mà không bị xung
 * đột.
 */
test("hai thiết bị đăng nhập cùng tài khoản", async ({ browser }) => {
  // Thiết bị A.
  const contextA = await browser.newContext();
  const pageA = contextA.newPage();
  mockAccount(pageA);
  await pageA.goto("/profile");
  await expect(pageA.getByText("E2E Cuber")).toBeVisible();

  // Thiết bị B (cùng tài khoản).
  const contextB = await browser.newContext();
  const pageB = contextB.newPage();
  mockAccount(pageB);
  await pageB.goto("/profile");
  await expect(pageB.getByText("E2E Cuber")).toBeVisible();

  await contextA.close();
  await contextB.close();
});
