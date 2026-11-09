import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

afterEach(() => cleanup());

function renderDialog(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const props = {
    open: true,
    title: "Xoá phòng?",
    description: "Phòng sẽ biến mất vĩnh viễn.",
    confirmLabel: "Xoá phòng",
    onConfirm: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<ConfirmDialog {...props} />);
  return props;
}

describe("ConfirmDialog", () => {
  it("hiện tiêu đề, mô tả và nút xác nhận", () => {
    renderDialog();

    expect(screen.getByRole("dialog")).not.toBeNull();
    expect(screen.getByText("Xoá phòng?")).not.toBeNull();
    expect(screen.getByText("Phòng sẽ biến mất vĩnh viễn.")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Xoá phòng" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Hủy" })).not.toBeNull();
  });

  it("không render gì khi đóng", () => {
    renderDialog({ open: false });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("gọi onConfirm khi bấm nút xác nhận", () => {
    const props = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Xoá phòng" }));
    expect(props.onConfirm).toHaveBeenCalled();
  });

  it("gọi onClose khi bấm nút hủy", () => {
    const props = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("khoá cả hai nút khi hành động đang chạy", () => {
    renderDialog({ pending: true });

    const confirm = screen.getByRole("button", { name: "Xoá phòng" });
    const cancel = screen.getByRole("button", { name: "Hủy" });
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    expect(confirm.getAttribute("aria-busy")).toBe("true");
    expect((cancel as HTMLButtonElement).disabled).toBe(true);
  });

  it("tô điểm nút xác nhận theo tone", () => {
    renderDialog({ tone: "danger" });

    expect(
      screen.getByRole("button", { name: "Xoá phòng" }).classList.contains(
        "bg-danger",
      ),
    ).toBe(true);
  });
});
