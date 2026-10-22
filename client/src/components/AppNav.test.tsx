// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
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

  it("đưa mọi route của app ra khỏi menu tài khoản và vào navbar", () => {
    renderNav();

    const routes = [
      { name: "Giải Rubik", href: "/" },
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
  });

  it("đánh dấu route đang mở bằng aria-current", () => {
    renderNav();

    expect(screen.getByRole("link", { name: "Giải Rubik" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Cài đặt" }).getAttribute("aria-current")).toBeNull();
  });
});
