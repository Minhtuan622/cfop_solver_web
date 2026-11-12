import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Select } from "@/components/ui/Select";
import {
  computeFloatingGeometry,
  floatingStyle,
} from "@/components/ui/floating";

afterEach(cleanup);

/**
 * Regression test cho dropdown tự vẽ.
 *
 * Trước đây các ô chọn dùng `<select>` gốc: mũi tên và danh sách bật lên do
 * hệ điều hành vẽ nên lệch với phần còn lại của trang, và không điều khiển
 * được bằng bàn phím theo cách của app. Test giữ cho dropdown luôn mở/đóng
 * đúng và chọn được bằng bàn phím.
 *
 * Nhóm test "danh sách nổi" chặn hai lỗi đã gặp trên Safari: danh sách bị
 * cắt mất bởi `overflow-hidden` của card chứa nó, và danh sách mở xuống tràn
 * khỏi khung nhìn khi nút nằm gần đáy trang.
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

describe("Select tự vẽ", () => {
  it("hiện nhãn của lựa chọn đang chọn", () => {
    renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Thể thức" });
    expect(trigger).toHaveTextContent("3x3x3");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("mở danh sách khi bấm vào nút", () => {
    renderSelect();
    fireEvent.click(screen.getByRole("combobox", { name: "Thể thức" }));
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(screen.getByRole("combobox", { name: "Thể thức" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("chọn được bằng chuột", () => {
    const onChange = renderSelect();
    fireEvent.click(screen.getByRole("combobox", { name: "Thể thức" }));
    fireEvent.click(screen.getByRole("option", { name: "4x4x4" }));
    expect(onChange).toHaveBeenCalledWith({ target: { value: "444" } });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("chọn được bằng bàn phím", () => {
    const onChange = renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Thể thức" });
    // Mũi tên xuống lần đầu chỉ mở danh sách.
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("listbox")).toBeTruthy();
    // Mũi tên xuống lần nữa mới chuyển sang lựa chọn kế tiếp, rồi Enter chọn.
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith({ target: { value: "444" } });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("Escape đóng danh sách mà không đổi giá trị", () => {
    const onChange = renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Thể thức" });
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Tab rời tiêu điểm thì đóng danh sách", () => {
    renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Thể thức" });
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeTruthy();
    // Không chặn mặc định: tiêu điểm vẫn chuyển sang control kế tiếp.
    fireEvent.keyDown(trigger, { key: "Tab" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("đánh dấu lựa chọn đang chọn cho trình đọc màn hình", () => {
    renderSelect();
    fireEvent.click(screen.getByRole("combobox", { name: "Thể thức" }));
    const selected = screen.getByRole("option", { name: "3x3x3" });
    expect(selected).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "4x4x4" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("không chọn được lựa chọn đang bị tắt", () => {
    const onChange = renderSelect();
    render(
      <Select aria-label="Khác" value="a" onChange={onChange}>
        <option value="a">A</option>
        <option value="b" disabled>
          B
        </option>
      </Select>,
    );
    const trigger = screen.getByRole("combobox", { name: "Khác" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("option", { name: "B" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("chấp nhận giá trị option là số (như <option value={0}>)", () => {
    const onChange = vi.fn();
    render(
      <Select aria-label="Tháng" value="0" onChange={onChange}>
        <option value={0}>Tất cả</option>
        <option value={1}>Tháng 1</option>
      </Select>,
    );
    const trigger = screen.getByRole("combobox", { name: "Tháng" });
    expect(trigger).toHaveTextContent("Tất cả");
    fireEvent.click(trigger);
    expect(screen.getByRole("option", { name: "Tất cả" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.click(screen.getByRole("option", { name: "Tháng 1" }));
    expect(onChange).toHaveBeenCalledWith({ target: { value: "1" } });
  });
});

describe("computeFloatingGeometry — chọn hướng mở và ghim chiều cao", () => {
  const base = {
    viewportWidth: 1280,
    scrollX: 0,
    scrollY: 0,
    triggerLeft: 100,
    triggerWidth: 240,
  };

  it("mở xuống khi dưới nút còn đủ chỗ", () => {
    const geometry = computeFloatingGeometry({
      ...base,
      viewportHeight: 900,
      triggerTop: 400,
      triggerBottom: 442,
    });
    expect(geometry.placement).toBe("bottom");
    // Dưới còn 900 - 8 - (442 + 8) = 442px ≥ 288 → đầy chiều cao mong muốn.
    expect(geometry.maxHeight).toBe(288);
    expect(geometry.left).toBe(100);
    expect(geometry.width).toBe(240);
    // Mép trên của danh sách cách đáy nút 8px.
    expect(geometry.anchor).toBe(450);
  });

  it("lật lên khi dưới không đủ chỗ", () => {
    const geometry = computeFloatingGeometry({
      ...base,
      viewportHeight: 800,
      triggerTop: 700,
      triggerBottom: 742,
    });
    expect(geometry.placement).toBe("top");
    // Trên còn 700 - 16 = 684px ≥ 288 → vẫn đủ chiều cao mong muốn.
    expect(geometry.maxHeight).toBe(288);
    // Mép dưới của danh sách cách đỉnh nút 8px.
    expect(geometry.anchor).toBe(692);
  });

  it("ghim chiều cao theo chỗ còn lại khi phía được chọn bị chật", () => {
    const geometry = computeFloatingGeometry({
      ...base,
      viewportHeight: 400,
      triggerTop: 100,
      triggerBottom: 142,
    });
    // Dưới: 400 - 8 - 150 = 242; trên: 100 - 16 = 84 → mở xuống, cao 242px.
    expect(geometry.placement).toBe("bottom");
    expect(geometry.maxHeight).toBe(242);
  });

  it("chọn phía còn nhiều chỗ hơn khi đáy nút đã chạm mép khung nhìn", () => {
    const geometry = computeFloatingGeometry({
      ...base,
      viewportHeight: 500,
      triggerTop: 480,
      triggerBottom: 498,
    });
    expect(geometry.placement).toBe("top");
    expect(geometry.maxHeight).toBe(288);
  });

  it("kẹp trái danh sách để không tràn mép phải khung nhìn", () => {
    const geometry = computeFloatingGeometry({
      viewportWidth: 1280,
      viewportHeight: 900,
      scrollX: 0,
      scrollY: 0,
      triggerTop: 100,
      triggerBottom: 142,
      triggerLeft: 1200,
      triggerWidth: 100,
    });
    // Nút hẹp hơn mức tối thiểu → danh sách rộng 192px (min-w-48).
    expect(geometry.width).toBe(192);
    // 1200 + 192 vượt mép phải → kéo về 1280 - 8 - 192.
    expect(geometry.left).toBe(1080);
  });

  it("cộng phần cuộn trang vào toạ độ tài liệu", () => {
    const geometry = computeFloatingGeometry({
      ...base,
      viewportHeight: 900,
      scrollX: 500,
      scrollY: 300,
      triggerTop: 400,
      triggerBottom: 442,
    });
    // Nút ở 100px trong khung nhìn nhưng trang đã cuộn ngang 500px.
    expect(geometry.left).toBe(600);
    // Mép trên danh sách: 442 + 300 + 8.
    expect(geometry.anchor).toBe(750);
  });

  it("đổi kết quả đo thành style vị trí đúng cho từng hướng", () => {
    const bottom = floatingStyle(
      {
        placement: "bottom",
        left: 100,
        width: 240,
        maxHeight: 288,
        anchor: 450,
      },
      { align: "start", rightDoc: 340, viewportWidth: 1280 },
    );
    expect(bottom).toEqual({
      left: 100,
      top: 450,
      width: 240,
      maxHeight: 288,
    });

    const top = floatingStyle(
      {
        placement: "top",
        left: 100,
        width: 240,
        maxHeight: 288,
        anchor: 692,
      },
      { align: "start", rightDoc: 340, viewportWidth: 1280 },
    );
    // Khi lật lên, mép dưới danh sách khớp mép trên nút: neo bằng mép trên
    // cộng translateY(-100%).
    expect(top).toEqual({
      left: 100,
      top: 692,
      width: 240,
      maxHeight: 288,
      transform: "translateY(-100%)",
    });
  });

  it("menu căn phải neo bằng mép phải của nút", () => {
    const menu = floatingStyle(
      {
        placement: "bottom",
        left: 100,
        width: 240,
        maxHeight: 288,
        anchor: 450,
      },
      { align: "end", rightDoc: 340, viewportWidth: 1280 },
    );
    expect(menu).toEqual({
      right: 940, // 1280 - 340
      top: 450,
      width: 240,
      maxHeight: 288,
    });
  });
});

describe("danh sách nổi qua portal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const rect = (top: number, bottom: number): DOMRect =>
    ({
      top,
      bottom,
      left: 100,
      right: 340,
      width: 240,
      height: bottom - top,
      x: 100,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;

  it("danh sách gắn vào body, không nằm trong cây card chứa nó", () => {
    renderSelect();
    fireEvent.click(screen.getByRole("combobox", { name: "Thể thức" }));
    const listbox = screen.getByRole("listbox");
    // Portal: wrapper ở body, ngoài cây DOM của component.
    expect(listbox.parentElement?.parentElement).toBe(document.body);
    expect(
      screen
        .getByRole("combobox", { name: "Thể thức" })
        .parentElement?.contains(listbox),
    ).toBe(false);
  });

  it("lật lên khi mở gần đáy khung nhìn và ghim đúng toạ độ", () => {
    renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Thể thức" });
    vi.stubGlobal("innerHeight", 800);
    vi.stubGlobal("innerWidth", 1280);
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue(rect(700, 742));
    fireEvent.click(trigger);
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("data-placement", "top");
    expect(listbox.style.top).toBe("692px"); // 700 - 8
    expect(listbox.style.transform).toBe("translateY(-100%)");
    expect(listbox.style.maxHeight).toBe("288px");
    expect(listbox.style.left).toBe("100px");
    expect(listbox.style.width).toBe("240px");
  });

  it("định vị lại khi cuộn trang trong lúc danh sách đang mở", () => {
    renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Thể thức" });
    vi.stubGlobal("innerHeight", 800);
    vi.stubGlobal("innerWidth", 1280);
    const rectSpy = vi.spyOn(trigger, "getBoundingClientRect");
    rectSpy.mockReturnValue(rect(100, 142));
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox").style.top).toBe("150px");
    // Cuộn trang: nút rơi xuống sát đáy khung nhìn → danh sách lật lên.
    rectSpy.mockReturnValue(rect(700, 742));
    fireEvent.scroll(window);
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("data-placement", "top");
    expect(listbox.style.top).toBe("692px");
    expect(listbox.style.transform).toBe("translateY(-100%)");
  });

  it("bấm ra ngoài thì đóng, kể cả khi danh sách đã nổi qua portal", () => {
    renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Thể thức" });
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeTruthy();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("bấm vào chính danh sách (nằm ngoài root) thì không đóng", () => {
    renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Thể thức" });
    fireEvent.click(trigger);
    fireEvent.pointerDown(screen.getByRole("listbox"));
    expect(screen.getByRole("listbox")).toBeTruthy();
  });
});
