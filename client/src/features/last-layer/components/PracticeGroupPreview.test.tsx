import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PracticeGroupPreview } from "./PracticeGroupPreview";

describe("PracticeGroupPreview", () => {
  it("renders a labeled 3x3 preview from the catalog state", () => {
    render(
      <PracticeGroupPreview
        state="UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
        label="Sune"
        compact
      />
    );

    expect(screen.getByRole("img", { name: "Sune: mặt U 3×3" })).toBeTruthy();
    expect(
      screen.getByLabelText("Xem trước Sune").querySelectorAll("span")
    ).toHaveLength(9);
  });

  it("falls back to a solved-looking top face for an invalid state", () => {
    render(<PracticeGroupPreview state="invalid" label="Fallback" />);

    expect(
      screen.getByRole("img", { name: "Fallback: mặt U 3×3" })
    ).toBeTruthy();
  });

  it("opens from click and keyboard activation when interactive", () => {
    const onClick = vi.fn();
    render(
      <PracticeGroupPreview
        state="UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
        label="T"
        onClick={onClick}
      />
    );

    const preview = screen.getByRole("button", { name: "Xem trước T" });
    fireEvent.click(preview);
    fireEvent.keyDown(preview, { key: "Enter" });

    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
