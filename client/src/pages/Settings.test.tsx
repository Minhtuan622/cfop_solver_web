// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Settings from "./Settings";
import { ThemeProvider } from "@/contexts/ThemeContext";

function renderPage() {
  return render(
    <ThemeProvider>
      <Settings />
    </ThemeProvider>,
  );
}

describe("Settings page", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("chỉ mở một nhóm cài đặt mỗi lần và giữ đúng một tiêu đề chính", () => {
    renderPage();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("tab")).toHaveLength(4);
    expect(screen.getByRole("tab", { name: "Lời giải" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe("settings-tab-solver");
  });

  it("chuyển sang nhóm khác khi bấm vào một mục", () => {
    renderPage();

    fireEvent.click(screen.getByRole("tab", { name: "Bấm giờ" }));

    expect(screen.getByRole("tab", { name: "Bấm giờ" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe("settings-tab-timer");
    expect(screen.getByRole("switch", { name: /Âm inspection/ })).toBeTruthy();
  });

  it("đưa nhóm giao diện ra khỏi nhóm học tập", () => {
    renderPage();

    fireEvent.click(screen.getByRole("tab", { name: "Giao diện" }));

    expect(screen.getByRole("button", { name: "Đổi ngôn ngữ" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Đổi giao diện/ })).toBeTruthy();
  });

  it("giữ nút khôi phục mặc định ở góc của cột nhóm", () => {
    renderPage();

    expect(screen.getByRole("button", { name: /Khôi phục mặc định/ })).toBeTruthy();
  });
});
