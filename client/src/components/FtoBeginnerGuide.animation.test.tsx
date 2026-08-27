import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FtoBeginnerGuide } from "./FtoBeginnerGuide";

vi.mock("@/components/PuzzleScramblePreview", () => ({
  PuzzleScramblePreview: ({ scramble, animationAlg }: { scramble: string; animationAlg?: string }) => <output data-testid="fto-preview" data-scramble={scramble} data-animation={animationAlg ?? ""} />,
}));

afterEach(() => cleanup());

describe("FtoBeginnerGuide animation", () => {
  it("opens on one concrete beginner action with a before-and-after FTO comparison", () => {
    render(<FtoBeginnerGuide language="vi" />);
    expect(screen.getByText("Bắt đầu từ đây")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /1\. Bắt đầu với ba cạnh trắng/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByText(/Tìm một mảnh có hai màu/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Trước")).toBeInTheDocument();
    expect(screen.getByText("Sau")).toBeInTheDocument();
    const previews = screen.getAllByTestId("fto-preview");
    expect(previews[0]).toHaveAttribute("data-scramble", "R U R'");
    expect(previews[1]).toHaveAttribute("data-scramble", "U U U");
  });

  it("animates a beginner formula from the displayed before state one turn at a time", () => {
    render(<FtoBeginnerGuide language="vi" />);
    fireEvent.click(screen.getByRole("button", { name: "Xem nước kế tiếp: Chèn cạnh mẫu bên phải" }));

    expect(screen.getByText("Đang mô phỏng nước 1/3: R")).toBeInTheDocument();
    expect(screen.getAllByTestId("fto-preview")[0]).toHaveAttribute("data-scramble", "R U R'");
    expect(screen.getAllByTestId("fto-preview")[0]).toHaveAttribute("data-animation", "R");
  });

  it("keeps the advanced Nautilus catalogue available behind the experienced learner choice", () => {
    render(<FtoBeginnerGuide language="vi" />);
    fireEvent.click(screen.getByRole("button", { name: "Tôi đã biết cơ bản" }));
    fireEvent.click(screen.getByRole("tab", { name: /2\. Last Triple/i }));
    fireEvent.click(screen.getByRole("button", { name: "Phát toàn bộ: Insert góc từ phải" }));

    expect(screen.getByText("Đang phát: R U' R'")).toBeInTheDocument();
    expect(screen.getAllByTestId("fto-preview")[0]).toHaveAttribute("data-scramble", "R U R'");
    expect(screen.getAllByTestId("fto-preview")[0]).toHaveAttribute("data-animation", "R U' R'");
  });
});
