import { afterEach, describe, expect, it, vi } from "vitest";
import { AVATAR_CROP_FRAME, renderCroppedAvatar } from "./avatarCrop";

const area = { x: 10, y: 20, width: 100, height: 100 };

describe("avatar crop", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("giữ nguyên kích thước khung cắt 280 px", () => {
    expect(AVATAR_CROP_FRAME).toBe(280);
  });

  it("trả lỗi rõ ràng khi trình duyệt không cấp được canvas 2d", async () => {
    vi.stubGlobal(
      "Image",
      class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      }
    );
    vi.stubGlobal(
      "HTMLCanvasElement",
      class MockCanvas {
        width = 0;
        height = 0;
        getContext() {
          return null;
        }
      }
    );
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:mock",
      revokeObjectURL: () => {},
    });

    await expect(
      renderCroppedAvatar(new Blob(["x"]), area, "image/png")
    ).rejects.toThrow("Không thể chuẩn bị ảnh đại diện.");
  });
});
