import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfileEditDialog } from "./ProfileEditDialog";
import { ProfilePasswordDialog } from "./ProfilePasswordDialog";

vi.mock("@/contexts/LanguageContext", async () => {
  const { translate } = await import("@/lib/i18n");
  return {
    useLanguage: () => ({
      language: "vi" as const,
      t: (key: string, params?: Record<string, string | number>) => translate("vi", key, params),
    }),
  };
});

afterEach(cleanup);

const account = { displayName: "Nguyễn Minh Tuấn", bio: "Luyện CFOP", avatarUrl: null, goalMs: 15_000 };
const editProps = {
  open: true,
  onOpenChange: () => undefined,
  account,
  avatarUploadEnabled: true,
  avatarPending: false,
  onChooseAvatar: () => undefined,
  savePending: false,
  error: "",
  onSubmit: () => undefined,
};

describe("hộp thoại chỉnh sửa hồ sơ", () => {
  it("mở ra với giá trị đã lưu và gửi đủ ba trường khi Lưu", () => {
    const onSubmit = vi.fn();
    render(<ProfileEditDialog {...editProps} onSubmit={onSubmit} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/Họ và tên|Tên hiển thị/)).toHaveValue("Nguyễn Minh Tuấn");
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(onSubmit).toHaveBeenCalledWith({ displayName: "Nguyễn Minh Tuấn", bio: "Luyện CFOP", goalSeconds: "15" });
  });

  it("Hủy đóng hộp thoại; không mở thì không vẽ gì", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<ProfileEditDialog {...editProps} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    rerender(<ProfileEditDialog {...editProps} open={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("hiện lỗi ngay trong hộp thoại và khoá nút khi đang lưu", () => {
    render(<ProfileEditDialog {...editProps} error="Tên quá ngắn" savePending />);
    expect(screen.getByRole("alert")).toHaveTextContent("Tên quá ngắn");
    expect(screen.getByRole("button", { name: "Đang lưu…" })).toBeDisabled();
  });
});

describe("hộp thoại đổi mật khẩu", () => {
  it("gửi mật khẩu cũ và mới, rồi đóng khi đổi xong", () => {
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn((_values: unknown, clear: () => void) => clear());
    render(<ProfilePasswordDialog open onOpenChange={onOpenChange} pending={false} error="" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Mật khẩu hiện tại"), { target: { value: "matkhaucu123" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), { target: { value: "matkhaumoi456" } });
    fireEvent.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
    expect(onSubmit).toHaveBeenCalledWith({ currentPassword: "matkhaucu123", newPassword: "matkhaumoi456" }, expect.any(Function));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
