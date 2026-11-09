// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Download, Play, RotateCcw, Trash2 } from "./Icon";
import { IconButton } from "./StudioUI";

afterEach(() => cleanup());

describe("IconButton", () => {
  it("lấy tên truy cập được từ label và hiện tooltip", () => {
    render(<IconButton label="Phát solution" icon={<Play className="text-base" />} />);

    const button = screen.getByRole("button", { name: "Phát solution" });
    expect(button).toHaveAttribute("aria-label", "Phát solution");
    expect(button).toHaveAttribute("title", "Phát solution");
    expect(button).toHaveAttribute("type", "button");
  });

  it("giữ layout của nút icon-only", () => {
    render(<IconButton label="Xuất JSON" icon={<Download className="text-base" />} />);

    const button = screen.getByRole("button", { name: "Xuất JSON" });
    expect(button).toHaveClass("inline-grid", "place-items-center", "rounded-full");
    expect(button.querySelector("svg")).not.toBeNull();
  });

  it("giữ trạng thái disabled và không gọi callback", () => {
    let clicks = 0;
    render(<IconButton label="Xóa solve" icon={<Trash2 className="text-base" />} disabled onClick={() => { clicks += 1; }} />);

    const button = screen.getByRole("button", { name: "Xóa solve" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(clicks).toBe(0);
  });

  it("cho phép đổi tooltip khi title khác label", () => {
    render(<IconButton label="Đặt lại góc nhìn 3D" title="Đặt lại góc nhìn" icon={<RotateCcw className="text-base" />} />);

    const button = screen.getByRole("button", { name: "Đặt lại góc nhìn 3D" });
    expect(button).toHaveAttribute("title", "Đặt lại góc nhìn");
  });
});
