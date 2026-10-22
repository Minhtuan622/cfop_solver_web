// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Dropdown } from "./Dropdown";

afterEach(() => cleanup());

function renderDropdown() {
  return render(
    <Dropdown id="demo-menu" label="Chọn một mục" menuLabel="Các mục" button={<span>Chọn</span>}>
      <li>
        <button type="button" role="menuitem" onClick={() => undefined}>Mục một</button>
      </li>
    </Dropdown>,
  );
}

describe("Dropdown", () => {
  it("chỉ mở menu khi bấm vào nút", () => {
    renderDropdown();

    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Chọn một mục" }));
    expect(screen.getByRole("menu")).not.toBeNull();
    expect(screen.getByRole("menuitem", { name: "Mục một" })).not.toBeNull();
  });

  it("đóng menu khi bấm ra ngoài hoặc bấm Escape", () => {
    renderDropdown();

    fireEvent.click(screen.getByRole("button", { name: "Chọn một mục" }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Chọn một mục" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("đóng menu sau khi chọn một mục", () => {
    renderDropdown();

    fireEvent.click(screen.getByRole("button", { name: "Chọn một mục" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Mục một" }));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("giữ nhãn riêng cho menu và cho nút", () => {
    renderDropdown();

    fireEvent.click(screen.getByRole("button", { name: "Chọn một mục" }));
    expect(screen.getByRole("menu").getAttribute("aria-label")).toBe("Các mục");
    expect(screen.getByRole("button", { name: "Chọn một mục" }).getAttribute("aria-controls")).toBe("demo-menu");
  });
});
