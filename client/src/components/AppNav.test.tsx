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

  it("chỉ hiện Giải, Cài đặt và các nhóm trên thanh điều hướng", () => {
    renderNav();

    expect(screen.getByRole("link", { name: "Giải" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: "Cài đặt" }).getAttribute("href")).toBe("/settings");
    for (const group of ["Luyện tập", "Cạnh tranh", "WCA", "Thông tin"]) {
      expect(screen.getByRole("button", { name: group })).toBeTruthy();
    }
    for (const hidden of ["Bấm giờ", "Kết quả", "Học thêm", "Rubik ảo", "Thi đấu", "Xếp hạng", "Giải WCA", "Ủng hộ"]) {
      expect(screen.queryByRole("link", { name: hidden })).toBeNull();
    }
  });

  it.each([
    ["Luyện tập", [["Bấm giờ", "/timer"], ["Kết quả", "/history"], ["Học thêm", "/study"], ["Rubik ảo", "/play"]]],
    ["Cạnh tranh", [["Thi đấu", "/rooms"], ["Xếp hạng", "/competition"]]],
    ["WCA", [["Giải WCA", "/wca"], ["Kỷ lục WCA", "/records"]]],
    ["Thông tin", [["Về chúng tôi", "/about"], ["Ủng hộ", "/donate"], ["Hướng dẫn sử dụng", "/guide"]]],
  ] as const)("nhóm %s mở ra đúng các trang", async (group, routes) => {
    const user = userEvent.setup();
    renderNav();

    await user.click(screen.getByRole("button", { name: group }));

    for (const [name, href] of routes) {
      expect(screen.getByRole("menuitem", { name }).getAttribute("href")).toBe(href);
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
      screen.getByRole("link", { name: "Cài đặt" }).getAttribute("aria-current")
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
