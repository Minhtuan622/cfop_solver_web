// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dropdown } from "./Dropdown";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

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

describe("Dropdown nổi qua portal", () => {
  const rect = (top: number, bottom: number, left: number, right: number): DOMRect =>
    ({
      top,
      bottom,
      left,
      right,
      width: right - left,
      height: bottom - top,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;

  it("menu gắn vào body, không bị cắt bởi card chứa nó", () => {
    renderDropdown();
    fireEvent.click(screen.getByRole("button", { name: "Chọn một mục" }));
    const menu = screen.getByRole("menu");
    // Portal: wrapper ở body, ngoài cây DOM của component.
    expect(menu.parentElement?.parentElement).toBe(document.body);
    expect(
      screen
        .getByRole("button", { name: "Chọn một mục" })
        .parentElement?.contains(menu),
    ).toBe(false);
  });

  it("mở xuống khi đủ chỗ, căn mép phải theo nút", () => {
    renderDropdown();
    const toggle = screen.getByRole("button", { name: "Chọn một mục" });
    vi.stubGlobal("innerHeight", 800);
    vi.stubGlobal("innerWidth", 1280);
    vi.spyOn(toggle, "getBoundingClientRect").mockReturnValue(
      rect(100, 142, 1000, 1100),
    );
    fireEvent.click(toggle);
    const menu = screen.getByRole("menu");
    expect(menu).toHaveAttribute("data-placement", "bottom");
    expect(menu.style.top).toBe("150px"); // 142 + 8
    expect(menu.style.right).toBe("180px"); // 1280 - 1100
    expect(menu.style.maxHeight).toBe("288px");
    expect(menu.style.width).toBe("208px"); // nút hẹp → mức tối thiểu min-w-52
  });

  it("lật lên khi mở gần đáy khung nhìn", () => {
    renderDropdown();
    const toggle = screen.getByRole("button", { name: "Chọn một mục" });
    vi.stubGlobal("innerHeight", 800);
    vi.stubGlobal("innerWidth", 1280);
    vi.spyOn(toggle, "getBoundingClientRect").mockReturnValue(
      rect(700, 742, 1200, 1300),
    );
    fireEvent.click(toggle);
    const menu = screen.getByRole("menu");
    expect(menu).toHaveAttribute("data-placement", "top");
    // Mép dưới menu khớp mép trên nút: 700 - 8, neo bằng translateY(-100%).
    expect(menu.style.top).toBe("692px");
    expect(menu.style.transform).toBe("translateY(-100%)");
    expect(menu.style.maxHeight).toBe("288px");
  });
});
