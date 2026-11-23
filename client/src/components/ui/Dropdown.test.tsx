import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dropdown, DropdownItem } from "./Dropdown";

// jsdom lacks the pointer-capture and scrollIntoView APIs that Radix uses.
beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
});

afterEach(cleanup);

function renderDropdown() {
  render(
    <Dropdown
      id="demo-menu"
      label="Chọn một mục"
      menuLabel="Các mục"
      button={<span>Chọn</span>}
    >
      <DropdownItem asChild>
        <button type="button">Mục một</button>
      </DropdownItem>
    </Dropdown>,
  );
}

describe("Dropdown", () => {
  it("chỉ mở menu khi bấm vào nút", async () => {
    const user = userEvent.setup();
    renderDropdown();

    expect(screen.queryByRole("menu")).toBeNull();
    const trigger = screen.getByRole("button", { name: "Chọn một mục" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Mục một" })).toBeTruthy();
  });

  it("đóng menu khi bấm ra ngoài hoặc bấm Escape", async () => {
    const user = userEvent.setup();
    renderDropdown();
    const trigger = screen.getByRole("button", { name: "Chọn một mục" });

    await user.click(trigger);
    expect(screen.getByRole("menu")).toBeTruthy();
    await user.click(document.body);
    expect(screen.queryByRole("menu")).toBeNull();

    await user.click(trigger);
    expect(screen.getByRole("menu")).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("đóng menu sau khi chọn một mục", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole("button", { name: "Chọn một mục" }));
    await user.click(screen.getByRole("menuitem", { name: "Mục một" }));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("giữ nhãn riêng cho menu và cho nút", async () => {
    const user = userEvent.setup();
    renderDropdown();

    const trigger = screen.getByRole("button", { name: "Chọn một mục" });
    await user.click(trigger);
    expect(screen.getByRole("menu").getAttribute("aria-label")).toBe("Các mục");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("điều hướng bàn phím được giữa các mục", async () => {
    const user = userEvent.setup();
    render(
      <Dropdown
        id="demo-menu-2"
        label="Chọn một mục"
        menuLabel="Các mục"
        button={<span>Chọn</span>}
      >
        <DropdownItem asChild>
          <button type="button">Mục một</button>
        </DropdownItem>
        <DropdownItem asChild>
          <button type="button">Mục hai</button>
        </DropdownItem>
      </Dropdown>,
    );

    const trigger = screen.getByRole("button", { name: "Chọn một mục" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menu")).toBeTruthy();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
