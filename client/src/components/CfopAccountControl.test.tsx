// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const invalidate = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ cfopAccount: { me: { invalidate } } }),
    cfopAccount: {
      me: { useQuery: () => ({ data: null }) },
      register: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      login: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      logout: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

import { CfopAccountControl } from "./CfopAccountControl";

describe("CfopAccountControl", () => {
  it("opens an independent account dialog and switches to registration", () => {
    render(<CfopAccountControl />);
    fireEvent.click(screen.getByRole("button", { name: /Đăng nhập/ }));
    expect(screen.getByText("Tài khoản này riêng cho CFOP Solver Studio, không liên quan đến tài khoản Manus.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Đăng ký" }));
    expect(screen.getByLabelText("Tên hiển thị")).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Mật khẩu")).toBeTruthy();
  });
});
