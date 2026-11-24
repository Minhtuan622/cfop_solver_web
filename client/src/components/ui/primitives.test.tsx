import "@testing-library/jest-dom/vitest";
import { describe, expect, it, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, cardClass } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/FormControls";

afterEach(cleanup);

describe("Button", () => {
  it("có nhãn rõ ràng và bấm được", async () => {
    let clicked = 0;
    render(
      <Button onClick={() => (clicked += 1)}>Bắt đầu</Button>,
    );
    const button = screen.getByRole("button", { name: "Bắt đầu" });
    button.click();
    expect(clicked).toBe(1);
  });

  it("mặc định không gửi form ngoài ý muốn", () => {
    render(<Button>Gửi</Button>);
    expect(screen.getByRole("button", { name: "Gửi" })).toHaveAttribute("type", "button");
  });

  it("giữ type khi nằm trong form", () => {
    render(
      <form>
        <Button type="submit">Gửi</Button>
      </form>,
    );
    expect(screen.getByRole("button", { name: "Gửi" })).toHaveAttribute("type", "submit");
  });

  it("đổi màu theo variant", () => {
    const { rerender } = render(<Button variant="primary">Nút</Button>);
    const button = screen.getByRole("button", { name: "Nút" });
    expect(button.className).toContain("bg-primary");
    expect(button.className).toContain("text-on-primary");

    rerender(<Button variant="secondary">Nút</Button>);
    expect(button.className).toContain("bg-surface");
    expect(button.className).not.toContain("bg-primary");
  });

  it("đổi khoảng đệm theo size", () => {
    const { rerender } = render(<Button size="xs">Nút</Button>);
    const button = screen.getByRole("button", { name: "Nút" });
    expect(button.className).toContain("px-3");
    expect(button.className).toContain("text-xs");

    rerender(<Button size="md">Nút</Button>);
    expect(button.className).toContain("px-4");
    expect(button.className).toContain("text-sm");
  });

  it("nút nhỏ giữ khoảng đệm của nút thường, chỉ nhỏ cỡ chữ", () => {
    render(<Button size="sm">Nút</Button>);
    const button = screen.getByRole("button", { name: "Nút" });
    expect(button.className).toContain("px-4");
    expect(button.className).toContain("text-xs");
  });

  it("khi đang chạy thì chặn bấm và báo busy", () => {
    render(<Button loading>Đang lưu</Button>);
    const button = screen.getByRole("button", { name: "Đang lưu" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("giữ biểu tượng đặt trước và sau nhãn", () => {
    render(
      <Button icon={<span data-testid="trước" />} iconRight={<span data-testid="sau" />}>
        Nhãn
      </Button>,
    );
    expect(screen.getByTestId("trước")).toBeTruthy();
    expect(screen.getByTestId("sau")).toBeTruthy();
  });
});

describe("Card", () => {
  it("dùng đúng chuỗi class chuẩn của panel", () => {
    const { container } = render(<Card>Nội dung</Card>);
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("rounded-card");
    expect(card.className).toContain("bg-surface");
    expect(card.className).not.toContain("shadow");
    expect(card.className).not.toContain("border");
  });

  it("thêm khoảng đệm khi được yêu cầu", () => {
    const { container } = render(<Card padded>Nội dung</Card>);
    expect((container.firstElementChild as HTMLElement).className).toContain("p-5");
  });

  it("CardBody dùng chung khoảng đệm", () => {
    const { container } = render(
      <Card>
        <CardBody>Nội dung</CardBody>
      </Card>,
    );
    expect(container.querySelector(".p-5")).toBeTruthy();
  });

  it("xuất class chuẩn để dùng chung ngoài component", () => {
    expect(cardClass).toContain("rounded-card");
  });
});

describe("ô nhập", () => {
  it("Input giữ nguyên thuộc tính của ô nhập", () => {
    render(<Input defaultValue="abc" aria-label="Tên" />);
    const input = screen.getByLabelText("Tên") as HTMLInputElement;
    expect(input.value).toBe("abc");
    expect(input.className).toContain("rounded-field");
    expect(input.className).toContain("focus:bg-surface-3");
    expect(input.className).not.toContain("ring");
  });

  it("Textarea có số dòng mặc định", () => {
    render(<Textarea aria-label="Ghi chú" />);
    const textarea = screen.getByLabelText("Ghi chú") as HTMLTextAreaElement;
    expect(textarea.rows).toBe(4);
    expect(textarea.className).toContain("rounded-field");
  });

  it("Input có icon thì chừa chỗ bên trái", () => {
    const { container } = render(<Input icon={<span />} aria-label="Tìm" />);
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.className).toContain("pl-10");
  });
});
