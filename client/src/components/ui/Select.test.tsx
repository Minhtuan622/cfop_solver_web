import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Select } from "@/components/ui/Select";

afterEach(cleanup);

/**
 * Regression test cho dropdown tự vẽ.
 *
 * Trước đây các ô chọn dùng `<select>` gốc: mũi tên và danh sách bật lên do
 * hệ điều hành vẽ nên lệch với phần còn lại của trang, và không điều khiển
 * được bằng bàn phím theo cách của app. Test giữ cho dropdown luôn mở/đóng
 * đúng và chọn được bằng bàn phím.
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
