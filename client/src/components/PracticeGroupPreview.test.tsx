import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PracticeGroupPreview } from "./PracticeGroupPreview";

describe("PracticeGroupPreview", () => {
  it("renders a labeled 3x3 preview from the catalog state", () => {
    render(<PracticeGroupPreview state="UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB" label="Sune" compact />);

    expect(screen.getByRole("img", { name: "Sune: mặt trên 3x3" })).toBeTruthy();
    expect(screen.getByLabelText("Preview Sune").querySelectorAll("span")).toHaveLength(9);
  });

  it("falls back to a solved-looking top face for an invalid state", () => {
    render(<PracticeGroupPreview state="invalid" label="Fallback" />);

    expect(screen.getByRole("img", { name: "Fallback: mặt trên 3x3" })).toBeTruthy();
  });
});
