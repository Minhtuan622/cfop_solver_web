import { expect, test } from "@playwright/test";

/**
 * Kịch bản e2e: hủy giải bộ giải.
 *
 * Kiểm tra việc nhấn "Dừng" trong khi bộ giải đang chạy không làm gián đoạn
 * giao diện và hiện thông báo hủy đúng.
 *
 * Script của Web Worker bị treo có chủ ý: bộ giải chạy hoàn toàn trong
 * trình duyệt (Pyodide), nên nếu không treo worker thì bài test sẽ phụ thuộc
 * vào tốc độ tải Pyodide và có thể bị flaky.
 */
test("hủy giải bộ giải không làm gián đoạn giao diện", async ({ page }) => {
  // Không fulfill → request treo, worker không bao giờ khởi động.
  await page.route("**/solverWorker*", () => {
    // Giữ request treo đến khi test kết thúc.
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

  // Nhập scramble để nút "Tìm cách giải" được bật.
  await page.locator("#home-scramble").fill("R U R' U'");
  await page.getByRole("button", { name: /Tìm cách giải/ }).click();

  // Trạng thái đang chạy: nút hủy xuất hiện.
  const cancel = page.getByRole("button", { name: "Dừng" });
  await expect(cancel).toBeVisible();

  // Nhấn hủy.
  await cancel.click();

  // Thông báo hủy xuất hiện và giao diện trở lại bình thường.
  await expect(page.getByText("Đã dừng solver theo yêu cầu.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Tìm cách giải/ })).toBeVisible();
});
