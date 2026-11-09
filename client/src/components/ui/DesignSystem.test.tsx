import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Banner, Chip, PillTabs, RoundButton } from "./DesignSystem";

afterEach(() => cleanup());

describe("design system components", () => {
  it("PillTabs marks the chosen option and reports changes", () => {
    const onChange = vi.fn();
    render(<PillTabs value="a" onChange={onChange} label="Chế độ" options={[{ value: "a", label: "A" }, { value: "b", label: "B" }]} />);
    expect(screen.getByRole("button", { name: "A" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "B" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("RoundButton keeps an accessible name", () => {
    render(<RoundButton label="Phát" icon={<i />} />);
    expect(screen.getByRole("button", { name: "Phát" })).toBeInTheDocument();
  });

  it("Chip shows the current state and Banner shows its message", () => {
    render(<><Chip active>R</Chip><Banner>Sẵn sàng</Banner></>);
    expect(screen.getByRole("button", { name: "R" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Sẵn sàng")).toBeInTheDocument();
  });
});
