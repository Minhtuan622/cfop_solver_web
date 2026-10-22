// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { fireEvent, screen } from "@testing-library/dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const invalidate = vi.fn();
const logoutMutate = vi.fn();
let accountData: { displayName: string; avatarUrl?: string | null } | null = null;

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ cfopAccount: { me: { invalidate } } }),
    cfopAccount: {
      me: { useQuery: () => ({ data: accountData }) },
      register: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      login: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      logout: { useMutation: () => ({ mutate: logoutMutate, isPending: false }) },
    },
  },
}));

import { CfopAccountControl } from "./CfopAccountControl";

describe("CfopAccountControl", () => {
  afterEach(() => {
    cleanup();
  });

  it("opens an independent account dialog and switches to registration", () => {
    accountData = null;
    render(<CfopAccountControl />);
    fireEvent.click(screen.getByRole("button", { name: /Đăng nhập/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Đăng nhập" }));
    expect(screen.getByText("Tài khoản này riêng cho CFOP Solver Studio, không liên quan đến tài khoản Manus.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Đăng ký" }));
    expect(screen.getByLabelText("Tên hiển thị")).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Mật khẩu")).toBeTruthy();
  });

  it("groups signed-in account actions inside a compact dropdown", () => {
    accountData = { displayName: "Dr Who", avatarUrl: "https://example.test/dr-who.png" };
    render(<CfopAccountControl />);

    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.getByRole("img", { name: "Ảnh đại diện của Dr Who" }).getAttribute("src")).toBe("https://example.test/dr-who.png");
    fireEvent.click(screen.getByRole("button", { name: /Dr Who/ }));
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByRole("menu").className).toContain("mt-2");
    expect(screen.getByRole("menuitem", { name: /Hồ sơ/ })).toBeTruthy();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Dr Who/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Đăng xuất/ }));
    expect(logoutMutate).toHaveBeenCalledOnce();
    accountData = null;
  });

  it("không còn liệt kê route của app trong menu tài khoản", () => {
    accountData = null;
    render(<CfopAccountControl />);

    fireEvent.click(screen.getByRole("button", { name: /Đăng nhập/ }));

    expect(screen.getByRole("menuitem", { name: "Đăng nhập" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Đăng ký" })).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: "Thi đấu" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "Xếp hạng" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "Giải WCA" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "Cài đặt" })).toBeNull();
  });
});
