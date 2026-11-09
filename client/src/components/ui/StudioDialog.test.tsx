import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./StudioDialog";

afterEach(cleanup);

describe("StudioDialog", () => {
  it("closes when Escape is pressed", () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <span>Nội dung modal</span>
      </Dialog>,
    );

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes when the dimmed backdrop is pressed", () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <span>Nội dung modal</span>
      </Dialog>,
    );

    fireEvent.mouseDown(screen.getByTestId("dialog-backdrop"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("names the dialog with its title and describes it with its description", () => {
    render(
      <Dialog open onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tiêu đề hộp thoại</DialogTitle>
            <DialogDescription>Mô tả ngắn của hộp thoại</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );

    const dialog = screen.getByRole("dialog");
    const title = screen.getByRole("heading", { name: "Tiêu đề hộp thoại" });
    const description = screen.getByText("Mô tả ngắn của hộp thoại");

    expect(title.id).toBeTruthy();
    expect(dialog.getAttribute("aria-labelledby")).toBe(title.id);
    expect(dialog.getAttribute("aria-describedby")).toBe(description.id);
  });

  it("moves focus into the dialog and returns it to the trigger", () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Mở hộp thoại
          </button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tiêu đề hộp thoại</DialogTitle>
              </DialogHeader>
              <button type="button">Nút trong hộp thoại</button>
            </DialogContent>
          </Dialog>
        </>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Mở hộp thoại" });
    trigger.focus();

    fireEvent.click(trigger);

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Nút trong hộp thoại" }),
    );

    fireEvent.keyDown(window, { key: "Escape" });

    expect(document.activeElement).toBe(trigger);
  });

  it("keeps Tab cycling inside the dialog", () => {
    render(
      <Dialog open onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tiêu đề hộp thoại</DialogTitle>
          </DialogHeader>
          <button type="button">Nút đầu</button>
          <button type="button">Nút cuối</button>
        </DialogContent>
      </Dialog>,
    );

    const first = screen.getByRole("button", { name: "Nút đầu" });
    const last = screen.getByRole("button", { name: "Nút cuối" });

    last.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("renders the content inside a single dialog container", () => {
    render(
      <Dialog open onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tiêu đề hộp thoại</DialogTitle>
          </DialogHeader>
          <div>Nội dung</div>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByText("Nội dung")).toBeInTheDocument();
  });
});
