import { expect, test, type Page, type Route } from "@playwright/test";

type Account = {
  id: number;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  goalMs: number | null;
  wcaId: string | null;
  createdAt: string;
  lastSignedIn: string;
};

const account: Account = {
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

function trpcJson(data: unknown) {
  return { contentType: "application/json", body: JSON.stringify([{ result: { data: { json: data } } }]) };
}

async function fulfillTrpc(route: Route, data: unknown) {
  await route.fulfill(trpcJson(data));
}

async function mockAccountSyncAndCompetition(page: Page) {
  let authenticated = false;
  let cloudPayload: unknown = null;
  let roundActive = false;
  let submitted = false;

  await page.route("**/api/trpc/**", async (route) => {
    const url = new URL(route.request().url());
    const rawPaths = decodeURIComponent(url.pathname.replace("/api/trpc/", "")).split(",");
    const resultFor = (path: string): unknown => {
      if (path === "cfopAccount.me") return authenticated ? account : null;
      if (path === "cfopAccount.register") { authenticated = true; return account; }
      if (path === "cfopAccount.cloudState.get") return cloudPayload ? { payload: cloudPayload, updatedAt: "2026-08-27T00:01:00.000Z" } : null;
      if (path === "cfopAccount.cloudState.save") { cloudPayload = { saved: true }; return { updatedAt: "2026-08-27T00:01:00.000Z" }; }
      if (path === "cfopAccount.wca.oauthStatus") return { configured: false };
      if (path === "competition.listMine") return [];
      if (path === "competition.create") return { code: "E2E701" };
      if (path === "competition.startRound") { roundActive = true; return { success: true }; }
      if (path === "competition.submit") { submitted = true; return { success: true }; }
      if (path === "competition.state") return {
        room: { id: 701, code: "E2E701", name: "Phòng E2E", hostAccountId: account.id, status: roundActive ? "active" : "waiting", format: "best_of_3", eventId: "333", multiBlindCubes: 2, maxPlayers: 4, currentRound: roundActive ? 1 : 0 },
        members: [
          { accountId: account.id, displayName: account.displayName, role: "player" },
          { accountId: 702, displayName: "Bạn luyện", role: "player" },
        ],
        isHost: true,
        isSpectator: false,
        isModerator: false,
        onlineSpectatorCount: 0,
        onlineSpectators: [],
        roundLimit: 3,
        activeRound: roundActive ? { id: 801, sequence: 1, scramble: "R U R' U'", scrambleBundle: [], startedAt: "2026-08-27T00:02:00.000Z" } : null,
        players: submitted ? [{ accountId: account.id, displayName: account.displayName, currentResult: { elapsedMs: 120, inspectionMs: 80, penalty: "none" } }] : [],
        standings: submitted ? [{ accountId: account.id, displayName: account.displayName, lastResult: { elapsedMs: 120, penalty: "none" } }] : [],
        messages: [],
        moderationLogs: [],
      };
      return null;
    };
    const results = rawPaths.map((path) => ({ result: { data: { json: resultFor(path) } } }));
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(results) });
  });

  return {
    cloudWasSaved: () => cloudPayload !== null,
    solveWasSubmitted: () => submitted,
  };
}

test("đăng ký, đồng bộ và hoàn tất lượt thi trong phòng bằng dữ liệu cô lập", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const state = await mockAccountSyncAndCompetition(page);

  await page.goto("/");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.getByRole("button", { name: "Đăng ký", exact: true }).click();
  await page.getByLabel("Tên hiển thị").fill(account.displayName);
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Mật khẩu").fill("E2E-password-2026");
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page.getByRole("button", { name: account.displayName })).toBeVisible();

  await page.getByRole("button", { name: account.displayName }).click();
  await page.getByRole("menuitem", { name: "Hồ sơ" }).click();
  await expect(page.getByRole("heading", { name: `Hồ sơ của ${account.displayName}` })).toBeVisible();
  await page.getByRole("button", { name: "Đồng bộ ngay" }).click();
  await expect.poll(state.cloudWasSaved).toBe(true);
  await expect(page.getByText("Đã đồng bộ thủ công lúc", { exact: false })).toBeVisible();

  await page.goto("/rooms");
  await page.getByLabel("Tên phòng").fill("Phòng E2E");
  await page.getByRole("button", { name: "Tạo phòng" }).click();
  await expect(page).toHaveURL(/\/rooms\/E2E701$/);
  await expect(page.getByRole("heading", { name: "Phòng E2E" })).toBeVisible();
  await page.getByRole("button", { name: "Bắt đầu lượt" }).click();
  await expect(page.getByText("Scramble chung")).toBeVisible();

  await page.keyboard.down("Space");
  await page.keyboard.up("Space");
  await expect(page.getByText("INSPECTION")).toBeVisible();
  await page.keyboard.down("Space");
  await page.keyboard.up("Space");
  await page.waitForTimeout(80);
  await page.keyboard.press("Space");
  await expect.poll(state.solveWasSubmitted).toBe(true);
  await expect(page.getByText("Đã nộp:", { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
});
