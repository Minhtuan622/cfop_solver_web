import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  EmptyState,
  Field,
  LoadingTransition,
  PendingButton,
  StatTile,
} from "./BootstrapUI";

afterEach(() => cleanup());

describe("LoadingTransition", () => {
  it("giữ nội dung và chuyển sang trạng thái hiển thị sau frame", async () => {
    render(<LoadingTransition>Đã tải</LoadingTransition>);

    const content = screen.getByText("Đã tải");
    expect(content?.classList.contains("loading-content")).toBe(true);
    await waitFor(() => expect(content?.classList.contains("loading-content-ready")).toBe(true));
    expect(screen.getByText("Đã tải")).not.toBeNull();
  });
});

describe("EmptyState", () => {
  it("hiện tiêu đề, mô tả và hành động", () => {
    render(
      <EmptyState
        icon={<span>icon</span>}
        title="Chưa có phòng."
        description="Tạo phòng mới để bắt đầu."
        action={<button type="button">Tạo phòng</button>}
      />,
    );

    expect(screen.getByText("Chưa có phòng.").classList.contains("cfop-empty-state__title")).toBe(true);
    expect(screen.getByText("Tạo phòng mới để bắt đầu.").classList.contains("cfop-empty-state__description")).toBe(true);
    expect(screen.getByRole("button", { name: "Tạo phòng" })).not.toBeNull();
    expect(screen.getByText("icon").parentElement?.getAttribute("aria-hidden")).toBe("true");
  });

  it("bỏ qua mô tả và hành động khi không được truyền", () => {
    const { container } = render(<EmptyState title="Trống" />);

    expect(screen.getByText("Trống")).not.toBeNull();
    expect(container.querySelector(".cfop-empty-state__description")).toBeNull();
    expect(container.querySelector(".cfop-empty-state__icon")).toBeNull();
  });
});

describe("StatTile", () => {
  it("hiện nhãn, giá trị, chi tiết và biểu tượng", () => {
    render(<StatTile label="Best single" value="9.42s" detail="hợp lệ" icon={<span>icon</span>} />);

    expect(screen.getByText("Best single")).not.toBeNull();
    expect(screen.getByText("9.42s")).not.toBeNull();
    expect(screen.getByText("hợp lệ")).not.toBeNull();
    expect(screen.getByText("icon")).not.toBeNull();
  });

  it("đổi nền theo tone", () => {
    const { container } = render(<StatTile label="Parity" value="YES" tone="warning" />);
    expect(container.querySelector(".card")?.classList.contains("bg-warning-subtle")).toBe(true);

    const dark = render(<StatTile label="Ao5" value="10.00s" tone="dark" />);
    expect(dark.container.querySelector(".card")?.classList.contains("cfop-inverse-tile")).toBe(true);
  });
});

describe("PendingButton", () => {
  it("khoá nút và báo busy trong lúc hành động đang chạy", () => {
    const { container } = render(
      <PendingButton className="btn btn-primary" pending>
        Tạo phòng
      </PendingButton>,
    );

    const button = screen.getByRole("button", { name: "Tạo phòng" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(container.querySelector(".spinner-border")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("giữ nút bấm được khi không chờ", () => {
    render(<PendingButton>Tạo phòng</PendingButton>);

    const button = screen.getByRole("button", { name: "Tạo phòng" });
    expect((button as HTMLButtonElement).disabled).toBe(false);
    expect(button.getAttribute("aria-busy")).toBeNull();
  });

  it("giữ nguyên hành vi submit khi nằm trong form", () => {
    render(
      <form onSubmit={event => event.preventDefault()}>
        <PendingButton>Tạo phòng</PendingButton>
      </form>,
    );

    const button = screen.getByRole("button", { name: "Tạo phòng" });
    expect(button.getAttribute("type")).toBeNull();
    expect(button.closest("form")).not.toBeNull();
  });
});

describe("Field", () => {
  it("gắn nhãn với điều khiển qua htmlFor và id", () => {
    render(
      <Field id="room-name" label="Tên phòng" required>
        <input id="room-name" />
      </Field>,
    );

    const input = screen.getByLabelText("Tên phòng");
    expect(input.getAttribute("id")).toBe("room-name");
  });

  it("hiện gợi ý, và chỉ hiện lỗi khi có lỗi", () => {
    const { rerender } = render(
      <Field id="room-name" label="Tên phòng" hint="Tối đa 80 ký tự.">
        <input id="room-name" />
      </Field>,
    );
    expect(screen.getByText("Tối đa 80 ký tự.")).not.toBeNull();

    rerender(
      <Field id="room-name" label="Tên phòng" hint="Tối đa 80 ký tự." error="Cần ít nhất 2 ký tự.">
        <input id="room-name" />
      </Field>,
    );
    expect(screen.queryByText("Tối đa 80 ký tự.")).toBeNull();
    expect(screen.getByRole("alert").textContent).toBe("Cần ít nhất 2 ký tự.");
  });
});
