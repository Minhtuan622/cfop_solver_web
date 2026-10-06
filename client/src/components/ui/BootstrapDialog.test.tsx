import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "./BootstrapDialog";

afterEach(cleanup);

describe("BootstrapDialog", () => {
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
});
