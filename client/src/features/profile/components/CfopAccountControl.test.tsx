// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { fireEvent, screen } from "@testing-library/dom";
import { afterEach, describe, expect, it, vi } from "vitest";

const invalidate = vi.fn();
const logoutMutate = vi.fn();
let accountData: { displayName: string; avatarUrl?: string | null } | null = null;
/** The error the next auth mutation fails with. */
let failure: unknown = null;
/** The `onError` handler each auth mutation registered with the mock. */
const handlers: { register?: (error: unknown) => void; login?: (error: unknown) => void } = {};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ cfopAccount: { me: { invalidate } } }),
    cfopAccount: {
      me: { useQuery: () => ({ data: accountData }) },
      register: {
        useMutation: (options?: { onError?: (error: unknown) => void }) => {
          handlers.register = options?.onError;
          return { mutate: () => handlers.register?.(failure), isPending: false };
        },
      },
      login: {
        useMutation: (options?: { onError?: (error: unknown) => void }) => {
          handlers.login = options?.onError;
          return { mutate: () => handlers.login?.(failure), isPending: false };
        },
      },
      logout: { useMutation: () => ({ mutate: logoutMutate, isPending: false }) },
    },
  },
}));

import { CfopAccountControl } from "./CfopAccountControl";
import { LanguageProvider } from "@/contexts/LanguageContext";

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

  it("báo lỗi thân thiện khi máy chủ hỏng, không lộ chi tiết bên trong", () => {
    accountData = null;
    failure = Object.assign(new Error("Failed query: select `id` from `cfop_accounts`"), {
      data: { httpStatus: 500 },
    });
    render(<CfopAccountControl />);

    fireEvent.click(screen.getByRole("button", { name: /Đăng nhập/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Đăng nhập" }));
    fireEvent.submit(document.querySelector("form")!);

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toBe("Máy chủ đang gặp sự cố. Vui lòng thử lại sau ít phút.");
    expect(alert.textContent).not.toContain("cfop_accounts");
    failure = null;
  });

  it("dịch lỗi email đã có tài khoản sang câu chữ của giao diện", () => {
    accountData = null;
    // The server writes in Vietnamese; the dialog shows the wording of the interface.
    failure = Object.assign(new Error("Email này đã có tài khoản CFOP."), {
      data: { code: "CONFLICT", httpStatus: 409 },
    });
    window.localStorage.setItem("cfop-language", "en");
    render(
      <LanguageProvider>
        <CfopAccountControl />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Sign in/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Create account" }));
    fireEvent.submit(document.querySelector("form")!);

    expect(screen.getByRole("alert").textContent).toBe("This email already has a CFOP account.");
    window.localStorage.clear();
    failure = null;
  });
});
