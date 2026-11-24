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

  it("gói các trang còn lại vào một menu Thêm, nhưng vẫn tới được", async () => {
    const user = userEvent.setup();
    renderNav();

    expect(screen.queryByRole("menuitem", { name: "Cài đặt" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Thêm" }));

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

  it("tách thẻ dropdown Tài khoản, Ngôn ngữ và Giao diện", async () => {
    const user = userEvent.setup();
    renderNav();

    // Thẻ Tài khoản nằm trên thanh nav với nút "Tài khoản và tuỳ chọn" (mặc định).
    const accountTrigger = screen.getByRole("button", {
      name: "Tài khoản và tuỳ chọn",
    });
    expect(accountTrigger).toBeTruthy();
    // Thẻ dropdown Ngôn ngữ và Giao diện cũng có tồn tại riêng.
    expect(
      screen.getByRole("button", { name: /Ngôn ngữ/ })
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /Giao diện/ })).toBeTruthy();

    await user.click(accountTrigger);
    expect(screen.getByRole("menuitem", { name: "Đăng nhập" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Đăng ký" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Ngôn ngữ/ }));
    expect(screen.getByRole("menuitemradio", { name: "Tiếng Việt" })).toBeTruthy();
    expect(screen.getByRole("menuitemradio", { name: "English" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Giao diện/ }));
    expect(screen.getByRole("menuitemradio", { name: "Sáng" })).toBeTruthy();
    expect(screen.getByRole("menuitemradio", { name: "Tối" })).toBeTruthy();
    expect(screen.getByRole("menuitemradio", { name: "Hệ thống" })).toBeTruthy();
  });

  it("thẻ dropdown Tài khoản hiển thị Hồ sơ/Đăng xuất khi đã đăng nhập", async () => {
    const user = userEvent.setup();
    renderNav();
    // Mặc định chưa đăng nhập → không hiện mục Hồ sơ/Đăng xuất.
    expect(screen.queryByRole("menuitem", { name: "Hồ sơ" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "Đăng xuất" })).toBeNull();
  });
});
