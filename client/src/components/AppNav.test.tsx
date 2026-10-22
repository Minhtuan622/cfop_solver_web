// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ cfopAccount: { me: { invalidate: vi.fn() } } }),
    cfopAccount: {
      me: { useQuery: () => ({ data: null }) },
      register: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      login: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      logout: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

import { AppNav } from "./AppNav";
import { ThemeProvider } from "@/contexts/ThemeContext";

function renderNav() {
  return render(
    <ThemeProvider>
      <AppNav />
    </ThemeProvider>,
  );
}

describe("AppNav", () => {
  afterEach(() => {
    cleanup();
  });

  it("giữ bốn trang dùng hằng ngày trên thanh điều hướng", () => {
    renderNav();

    const routes = [
      { name: "Giải", href: "/" },
      { name: "Bấm giờ", href: "/timer" },
      { name: "Kết quả", href: "/history" },
      { name: "Học thêm", href: "/study" },
    ];

    for (const route of routes) {
      const link = screen.getByRole("link", { name: route.name });
      expect(link.getAttribute("href")).toBe(route.href);
    }
  });

  it("gói các trang còn lại vào một menu Thêm, nhưng vẫn tới được", () => {
    renderNav();

    expect(screen.queryByRole("menuitem", { name: "Cài đặt" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }));

    const routes = [
      { name: "Thi đấu", href: "/rooms" },
      { name: "Xếp hạng", href: "/competition" },
      { name: "Giải WCA", href: "/wca" },
      { name: "Cài đặt", href: "/settings" },
    ];

    for (const route of routes) {
      const link = screen.getByRole("menuitem", { name: route.name });
      expect(link.getAttribute("href")).toBe(route.href);
    }
  });

  it("đánh dấu route đang mở bằng aria-current", () => {
    renderNav();

    expect(screen.getByRole("link", { name: "Giải" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Bấm giờ" }).getAttribute("aria-current")).toBeNull();
  });

  it("thu gọn nút ngôn ngữ và giao diện còn đúng một biểu tượng", () => {
    renderNav();

    expect(screen.getByRole("button", { name: "Đổi ngôn ngữ" }).textContent).toBe("");
    expect(screen.getByRole("button", { name: /Đổi giao diện/ }).textContent).toBe("");
  });
});
