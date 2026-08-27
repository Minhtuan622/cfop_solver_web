// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
  it("opens an independent account dialog and switches to registration", () => {
    accountData = null;
    render(<CfopAccountControl />);
    fireEvent.click(screen.getByRole("button", { name: /Đăng nhập/ }));
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
    fireEvent.click(screen.getByRole("menuitem", { name: /Đăng xuất/ }));
    expect(logoutMutate).toHaveBeenCalledOnce();
    accountData = null;
  });
});
