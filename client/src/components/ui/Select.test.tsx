import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "@/components/ui/Select";

// jsdom lacks the pointer-capture and scrollIntoView APIs that Radix uses.
beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
});

afterEach(cleanup);

/**
 * Regression test cho dropdown dựa trên Radix Select.
 *
 * Component giữ đúng API của `<select>` (vẫn nhận `<option value="…">`),
 * nhưng hành vi mở/đóng, bàn phím và accessibility do Radix đảm nhiệm.
 */
function renderSelect(onChange = vi.fn()) {
  render(
    <Select aria-label="Thể thức" value="333" onChange={onChange}>
      <option value="333">3x3x3</option>
      <option value="444">4x4x4</option>
      <option value="555">5x5x5</option>
    </Select>,
  );
  return onChange;
}

describe("Select (Radix)", () => {
  it("shows the current selection and starts closed", () => {
    renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Thể thức" });
    expect(trigger).toHaveTextContent("3x3x3");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the list on click with all options", async () => {
    const user = userEvent.setup();
    renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Thể thức" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("selects an option with the mouse and closes", async () => {
    const user = userEvent.setup();
    const onChange = renderSelect();
    await user.click(screen.getByRole("combobox", { name: "Thể thức" }));
    await user.click(screen.getByRole("option", { name: "4x4x4" }));
    expect(onChange).toHaveBeenCalledWith({ target: { value: "444" } });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("keyboard: opens with ArrowDown and selects with Enter", async () => {
    const user = userEvent.setup();
    const onChange = renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Thể thức" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toBeTruthy();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith({ target: { value: "444" } });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("Escape closes without selecting", async () => {
    const user = userEvent.setup();
    const onChange = renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Thể thức" });
    await user.click(trigger);
    expect(screen.getByRole("listbox")).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("marks the current selection for assistive tech", async () => {
    const user = userEvent.setup();
    renderSelect();
    await user.click(screen.getByRole("combobox", { name: "Thể thức" }));
    expect(screen.getByRole("option", { name: "3x3x3" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("option", { name: "4x4x4" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("disabled option cannot be selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select aria-label="Khác" value="a" onChange={onChange}>
        <option value="a">A</option>
        <option value="b" disabled>
          B
        </option>
      </Select>,
    );
    await user.click(screen.getByRole("combobox", { name: "Khác" }));
    await user.click(screen.getByRole("option", { name: "B" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("accepts numeric option values (value={0})", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select aria-label="Tháng" value="0" onChange={onChange}>
        <option value={0}>Tất cả</option>
        <option value={1}>Tháng 1</option>
      </Select>,
    );
    expect(screen.getByRole("combobox", { name: "Tháng" })).toHaveTextContent(
      "Tất cả",
    );
    await user.click(screen.getByRole("combobox", { name: "Tháng" }));
    expect(screen.getByRole("option", { name: "Tất cả" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.click(screen.getByRole("option", { name: "Tháng 1" }));
    expect(onChange).toHaveBeenCalledWith({ target: { value: "1" } });
  });
});
