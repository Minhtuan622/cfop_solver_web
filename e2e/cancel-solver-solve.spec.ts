import { expect, test } from "@playwright/test";

test("hủy giải bộ giải không làm gián đoạn giao diện", async ({ page }) => {
  await page.route("**/solverWorker*", () => {
  });

  await page.route("**/api/trpc/cfopAccount.me**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          result: {
            data: {
              json: {
                id: 1,
                email: "e2e@example.test",
                displayName: "E2E Cuber",
                bio: "",
                avatarUrl: "",
                goalMs: null,
                wcaId: null,
                createdAt: "2026-08-27T00:00:00.000Z",
                lastSignedIn: "2026-08-27T00:00:00.000Z",
              },
            },
          },
        },
      ]),
    }),
  );

  await page.goto("/");

  await page.locator("#home-scramble").fill("R U R' U'");
  await page.getByRole("button", { name: /Tìm cách giải/ }).click();

  const cancel = page.getByRole("button", { name: "Dừng" });
  await expect(cancel).toBeVisible();

  await cancel.click();

  await expect(page.getByText("Đã dừng solver theo yêu cầu.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Tìm cách giải/ })).toBeVisible();
});
