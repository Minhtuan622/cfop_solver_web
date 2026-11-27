// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    </ThemeProvider>
  );
}

describe("AppNav", () => {
  afterEach(() => {
    cleanup();
  });

  it("hiện tất cả trang chính ngay trên thanh điều hướng", () => {
    renderNav();

    const routes = [
      { name: "Giải", href: "/" },
      { name: "Bấm giờ", href: "/timer" },
      { name: "Kết quả", href: "/history" },
      { name: "Học thêm", href: "/study" },
      { name: "Thi đấu", href: "/rooms" },
      { name: "Xếp hạng", href: "/competition" },
      { name: "Giải WCA", href: "/wca" },
      { name: "Cài đặt", href: "/settings" },
    ];

    for (const route of routes) {
      const link = screen.getByRole("link", { name: route.name });
      expect(link.getAttribute("href")).toBe(route.href);
    }
    expect(screen.queryByRole("button", { name: "Thêm" })).toBeNull();
  });

  it("gói Về chúng tôi, Ủng hộ và Hướng dẫn vào menu Thông tin", async () => {
    const user = userEvent.setup();
    renderNav();

    expect(screen.queryByRole("menuitem", { name: "Về chúng tôi" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Ủng hộ" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Thông tin" }));

    const routes = [
      { name: "Về chúng tôi", href: "/about" },
      { name: "Ủng hộ", href: "/donate" },
      { name: "Hướng dẫn sử dụng", href: "/guide" },
    ];

    for (const route of routes) {
      const link = screen.getByRole("menuitem", { name: route.name });
      expect(link.getAttribute("href")).toBe(route.href);
    }
  });

  it("thanh điều hướng phẳng: nền đặc, không blur, không gradient", () => {
    const { container } = renderNav();
    const bar = container.querySelector("header > div");

    expect(bar).not.toBeNull();
    expect(bar?.classList.contains("bg-surface")).toBe(true);
    expect(bar?.className).not.toMatch(/backdrop-|shadow|border|gradient|from-/);
  });

  it("đánh dấu route đang mở bằng aria-current", () => {
    renderNav();

    expect(
      screen.getByRole("link", { name: "Giải" }).getAttribute("aria-current")
    ).toBe("page");
    expect(
      screen.getByRole("link", { name: "Bấm giờ" }).getAttribute("aria-current")
    ).toBeNull();
  });

  it("gộp ngôn ngữ, giao diện và tài khoản vào một menu", async () => {
    const user = userEvent.setup();
    renderNav();

    expect(
      screen.getByRole("button", { name: "Tài khoản và tuỳ chọn" })
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Đổi ngôn ngữ" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Đổi giao diện/ })
    ).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Tài khoản và tuỳ chọn" })
    );

    expect(screen.getByRole("menuitem", { name: "Đăng nhập" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Đăng ký" })).toBeTruthy();
    expect(screen.getByRole("menuitemradio", { name: "Tiếng Việt" })).toBeTruthy();
    expect(screen.getByRole("menuitemradio", { name: "English" })).toBeTruthy();
    expect(screen.getByRole("menuitemradio", { name: "Sáng" })).toBeTruthy();
    expect(screen.getByRole("menuitemradio", { name: "Tối" })).toBeTruthy();
    expect(screen.getByRole("menuitemradio", { name: "Hệ thống" })).toBeTruthy();
  });
});
