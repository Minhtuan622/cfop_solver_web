// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IconButton } from "./BootstrapUI";

afterEach(() => cleanup());

describe("IconButton", () => {
  it("lấy tên truy cập được từ label và hiện tooltip", () => {
    render(<IconButton label="Phát solution" icon={<i className="bi bi-play-fill" />} />);

    const button = screen.getByRole("button", { name: "Phát solution" });
    expect(button).toHaveAttribute("aria-label", "Phát solution");
    expect(button).toHaveAttribute("title", "Phát solution");
    expect(button).toHaveAttribute("type", "button");
  });

  it("giữ layout của nút icon-only", () => {
    render(<IconButton label="Xuất JSON" icon={<i className="bi bi-download" />} className="btn btn-outline-secondary btn-sm" />);

    const button = screen.getByRole("button", { name: "Xuất JSON" });
    expect(button).toHaveClass("cfop-icon-button", "d-inline-flex", "align-items-center", "justify-content-center");
    expect(button).toHaveClass("btn", "btn-outline-secondary", "btn-sm");
    expect(button.querySelector(".bi-download")).not.toBeNull();
  });

  it("giữ trạng thái disabled và không gọi callback", () => {
    let clicks = 0;
    render(<IconButton label="Xóa solve" icon={<i className="bi bi-trash" />} disabled onClick={() => { clicks += 1; }} />);

    const button = screen.getByRole("button", { name: "Xóa solve" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(clicks).toBe(0);
  });

  it("cho phép đổi tooltip khi title khác label", () => {
    render(<IconButton label="Đặt lại góc nhìn 3D" title="Đặt lại góc nhìn" icon={<i className="bi bi-arrow-counterclockwise" />} />);

    const button = screen.getByRole("button", { name: "Đặt lại góc nhìn 3D" });
    expect(button).toHaveAttribute("title", "Đặt lại góc nhìn");
  });
});
