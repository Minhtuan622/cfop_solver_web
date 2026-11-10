import { expect, test, type Page } from "@playwright/test";

/**
 * Kịch bản e2e: hủy giải bộ giải.
 *
 * Kiểm tra việc nhấn "Dừng" trong khi bộ giải đang chạy không làm gián đoạn
 * giao diện và hiện thông báo hủy đúng.
 */
test("hủy giải bộ giải không làm gián đoạn giao diện", async ({ page }) => {
  // Mô phỏng tài khoản đã đăng nhập.
  await page.route("**/api/trpc/cfopAccount.me", (route) =>
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
                createdAt: "2026-08-27T00:00:00.000Z",
                lastSignedIn: "2026-08-27T00:00:00.000Z",
              },
            },
          },
        ],
      }),
    }),
  );

  // Bỏ qua cloud state save (không cần thiết cho thử nghiệm này).
  await page.route("**/api/trpc/cfopAccount.cloudState.save", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        { result: { data: { json: { updatedAt: "2026-08-27T00:01:00.000Z" } } } },
      ]),
    }),
  );

  // Gọi giải treo (không bao giờ hoàn tất) để có thể nhấn hủy.
  await page.route("**/api/trpc/cfopAccount.solve", () => {
    // Không gọi route.fulfill → request treo đến khi bị hủy.
  });

  await page.goto("/");
  await page.getByRole("button", { name: /Tìm cách giải/ }).click();

  // Đợi trạng thái đang chạy.
  await expect(page.getByText(/Đang tìm/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Dừng" })).toBeVisible();

  // Nhấn hủy.
  await page.getByRole("button", { name: "Dừng" }).click();

  // Thông báo hủy xuất hiện và giao diện bình thường (nút tìm cách giải trở lại).
  await expect(page.getByText("Đã dừng solver theo yêu cầu.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Tìm cách giải/ })).toBeVisible();
});
