// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DonateQrPanel } from "./DonateQrPanel";

const ITEMS = [
  { id: "bank", label: "Ngân hàng", note: "Nguyễn Văn A · Vietcombank", image: "/donate/bank.png", copyText: "0123456789" },
  { id: "momo", label: "MoMo", note: "Nguyễn Văn A · MoMo", image: "/donate/momo.png" },
];

function renderPanel(items: typeof ITEMS) {
  return render(
    <LanguageProvider>
      <DonateQrPanel items={items} />
    </LanguageProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("DonateQrPanel", () => {
  it("báo chưa có ảnh QR khi danh sách rỗng", () => {
    renderPanel([]);
    expect(screen.getByText("Chưa có ảnh QR")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  it("hiện đúng ảnh, ghi chú và nút tải của một kênh, không có thanh chọn", () => {
    renderPanel(ITEMS.slice(0, 1));
    const image = screen.getByRole("img", { name: "Mã QR ủng hộ: Ngân hàng" });
    expect(image.getAttribute("src")).toBe("/donate/bank.png");
    expect(screen.getByText("Nguyễn Văn A · Vietcombank")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Tải ảnh QR" }).getAttribute("href")).toBe("/donate/bank.png");
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  it("có thanh chọn kênh khi có từ hai mã, đổi kênh thì đổi ảnh và ẩn nút sao chép nếu thiếu số", async () => {
    const user = userEvent.setup();
    renderPanel(ITEMS);
    expect(screen.getByRole("tab", { name: "Ngân hàng", selected: true })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sao chép số tài khoản" })).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: "MoMo" }));
    expect(screen.getByRole("img", { name: "Mã QR ủng hộ: MoMo" }).getAttribute("src")).toBe("/donate/momo.png");
    expect(screen.queryByRole("button", { name: "Sao chép số tài khoản" })).toBeNull();
  });

  it("sao chép số tài khoản vào clipboard và báo đã sao chép", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    renderPanel(ITEMS.slice(0, 1));
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await user.click(screen.getByRole("button", { name: "Sao chép số tài khoản" }));
    expect(writeText).toHaveBeenCalledWith("0123456789");
    expect(await screen.findByText("Đã sao chép")).toBeTruthy();
  });
});
