import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./StudioDialog";

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
});

afterEach(cleanup);

describe("StudioDialog", () => {
  it("closes when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <span>Nội dung modal</span>
      </Dialog>,
    );

    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes when the dimmed backdrop is pressed", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <span>Nội dung modal</span>
      </Dialog>,
    );

    await user.click(screen.getByTestId("dialog-backdrop"));

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

  it("moves focus into the dialog and returns it to the trigger", async () => {
    const user = userEvent.setup();
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

    await user.click(trigger);

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Nút trong hộp thoại" }),
    );

    await user.keyboard("{Escape}");

    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("keeps Tab cycling inside the dialog", async () => {
    const user = userEvent.setup();
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
    await user.keyboard("{Tab}");
    expect(document.activeElement).toBe(first);

    await user.keyboard("{Shift>}{Tab}{/Shift}");
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

  it("renders the footer actions inside the dialog", () => {
    render(
      <Dialog open onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tiêu đề hộp thoại</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <button type="button">Hành động</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole("button", { name: "Hành động" })).toBeInTheDocument();
  });
});
