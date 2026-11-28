import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfileWcaSection } from "./ProfileWcaSection";

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

const baseProps = {
  wcaProfile: undefined,
  refreshing: false,
  loading: false,
  entries: [],
  oauthConfigured: true,
  oauthPending: false,
  onStartOAuth: () => undefined,
  unlinkPending: false,
};

describe("ProfileWcaSection: gỡ liên kết WCA", () => {
  it("chỉ hiện nút gỡ khi tài khoản đã liên kết WCA", () => {
    render(<ProfileWcaSection {...baseProps} wcaId={null} onUnlink={() => undefined} />);
    expect(screen.queryByRole("button", { name: "Gỡ liên kết" })).toBeNull();
  });

  it("hỏi xác nhận trước khi gỡ; Hủy thì không gỡ", () => {
    const onUnlink = vi.fn();
    render(<ProfileWcaSection {...baseProps} wcaId="2016ABCD01" onUnlink={onUnlink} />);
    fireEvent.click(screen.getByRole("button", { name: "Gỡ liên kết" }));
    expect(screen.getByText("Gỡ liên kết WCA?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    expect(onUnlink).not.toHaveBeenCalled();
    expect(screen.queryByText("Gỡ liên kết WCA?")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Gỡ liên kết" }));
    const dialog = screen.getByRole("dialog");
    const confirm = Array.from(dialog.querySelectorAll("button")).find(button => button.textContent === "Gỡ liên kết");
    fireEvent.click(confirm!);
    expect(onUnlink).toHaveBeenCalledTimes(1);
  });

  it("khoá nút trong lúc đang gỡ", () => {
    render(<ProfileWcaSection {...baseProps} wcaId="2016ABCD01" unlinkPending onUnlink={() => undefined} />);
    expect(screen.getByRole("button", { name: "Đang gỡ…" })).toBeDisabled();
  });
});

describe("ProfileWcaSection: liên kết WCA", () => {
  it("chưa liên kết và máy chủ sẵn sàng: nút Liên kết bấm được", () => {
    const onStartOAuth = vi.fn();
    render(<ProfileWcaSection {...baseProps} wcaId={null} onStartOAuth={onStartOAuth} onUnlink={() => undefined} />);
    const button = screen.getByRole("button", { name: "Liên kết bằng WCA" });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onStartOAuth).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Chưa bật đăng nhập WCA trên máy chủ")).toBeNull();
  });

  it("máy chủ chưa cấu hình: nút khoá và nói rõ cần làm gì", () => {
    render(<ProfileWcaSection {...baseProps} wcaId={null} oauthConfigured={false} onUnlink={() => undefined} />);
    expect(screen.getByRole("button", { name: "Liên kết bằng WCA" })).toBeDisabled();
    expect(screen.getByText("Chưa bật đăng nhập WCA trên máy chủ")).toBeInTheDocument();
    expect(screen.getByText(/WCA_CLIENT_ID/)).toBeInTheDocument();
  });

  it("đang kiểm tra cấu hình thì nút khoá nhưng chưa kêu lỗi", () => {
    render(<ProfileWcaSection {...baseProps} wcaId={null} oauthConfigured={undefined} onUnlink={() => undefined} />);
    expect(screen.getByRole("button", { name: "Liên kết bằng WCA" })).toBeDisabled();
    expect(screen.queryByText("Chưa bật đăng nhập WCA trên máy chủ")).toBeNull();
  });

  it("đã liên kết thì không còn nút Liên kết", () => {
    render(<ProfileWcaSection {...baseProps} wcaId="2016ABCD01" onUnlink={() => undefined} />);
    expect(screen.queryByRole("button", { name: "Liên kết bằng WCA" })).toBeNull();
    expect(screen.getByRole("link", { name: /Mở WCA/ })).toHaveAttribute("href", expect.stringContaining("2016ABCD01"));
  });
});
