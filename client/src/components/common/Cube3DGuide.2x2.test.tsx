// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Cube3DGuide } from "./Cube3DGuide";

vi.mock("@/contexts/LanguageContext", async () => {
  const { translate } = await import("@/lib/i18n");
  return {
    useLanguage: () => ({
      language: "vi" as const,
      t: (key: string, params?: Record<string, string | number>) =>
        translate("vi", key, params),
    }),
  };
});

describe("Cube3DGuide 2×2", () => {
  it("renders a six-face 2×2 model with four visible stickers per face", async () => {
    const { container } = render(
      <Cube3DGuide
        state="UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
        dimension={2}
        step={0}
      />
    );
    await waitFor(() => {
      const faces = container.querySelectorAll(".cube3d-face-fallback");
      expect(faces).toHaveLength(6);
      faces.forEach((face: Element) =>
        expect(face.querySelectorAll(".cube3d-sticker-fallback")).toHaveLength(4)
      );
      // Mô hình 3D được tải lười: cho thêm thời gian khi máy test đang bận.
    }, { timeout: 5000 });
  });
});
