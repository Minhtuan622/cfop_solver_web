// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BootstrapControlEnhancer } from "./App";

afterEach(() => cleanup());

function IconButton({ label, disabled = false }: { label: string; disabled?: boolean }) {
  return <button type="button" aria-label={label} disabled={disabled}><i className="bi bi-play-fill" /></button>;
}

describe("BootstrapControlEnhancer", () => {
  it("giữ tên truy cập được và gắn tooltip Bootstrap cho action icon-only", async () => {
    render(<><BootstrapControlEnhancer /><IconButton label="Phát solution" /></>);

    const button = screen.getByRole("button", { name: "Phát solution" });
    await waitFor(() => expect(button).toHaveAttribute("data-bs-toggle", "tooltip"));
    expect(button).toHaveAttribute("aria-label", "Phát solution");
    expect(button).toHaveAttribute("data-bs-original-title", "Phát solution");
    expect(button).toHaveClass("p-2", "d-inline-flex", "align-items-center", "justify-content-center");

    fireEvent.mouseOver(button);
    await waitFor(() => expect(document.body.querySelector(".tooltip")).toHaveTextContent("Phát solution"));
  });

  it("xử lý control icon-only được render sau khi enhancer đã mount", async () => {
    const { rerender } = render(<><BootstrapControlEnhancer /><div data-testid="mount" /></>);
    rerender(<><BootstrapControlEnhancer /><div data-testid="mount"><IconButton label="Xuất JSON" /></div></>);

    const button = screen.getByRole("button", { name: "Xuất JSON" });
    await waitFor(() => expect(button).toHaveAttribute("data-bs-toggle", "tooltip"));
    expect(button).toHaveAttribute("data-bs-original-title", "Xuất JSON");
  });

  it("giữ aria-label và trạng thái disabled nhưng không tạo tooltip tương tác", async () => {
    render(<><BootstrapControlEnhancer /><IconButton label="Phát solution chưa có dữ liệu" disabled /></>);

    const button = screen.getByRole("button", { name: "Phát solution chưa có dữ liệu" });
    await waitFor(() => expect(button).toHaveClass("text-body-secondary"));
    expect(button).toHaveAttribute("aria-label", "Phát solution chưa có dữ liệu");
    expect(button).not.toHaveAttribute("data-bs-toggle", "tooltip");
  });
});
