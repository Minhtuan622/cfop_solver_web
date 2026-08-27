import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FtoBeginnerGuide } from "./FtoBeginnerGuide";

vi.mock("@/components/PuzzleScramblePreview", () => ({
  PuzzleScramblePreview: ({ scramble, animationAlg }: { scramble: string; animationAlg?: string }) => <output data-testid="fto-preview" data-scramble={scramble} data-animation={animationAlg ?? ""} />,
}));

afterEach(() => cleanup());

describe("FtoBeginnerGuide animation", () => {
  it("starts a documented FTO formula from its matching setup state", () => {
    render(<FtoBeginnerGuide language="vi" />);
    fireEvent.click(screen.getByRole("tab", { name: /3\. Chèn các cạnh còn lại/i }));
    fireEvent.click(screen.getByRole("button", { name: "Phát animation: Chèn từ DL vào FR" }));

    expect(screen.getByText("Đang phát: Chèn từ DL vào FR · R' D R")).toBeInTheDocument();
    expect(screen.getByTestId("fto-preview")).toHaveAttribute("data-scramble", "R' D' R");
    expect(screen.getByTestId("fto-preview")).toHaveAttribute("data-animation", "R' D R");
  });

  it("restores the step illustration after the learner chooses reset", () => {
    render(<FtoBeginnerGuide language="vi" />);
    fireEvent.click(screen.getByRole("tab", { name: /3\. Chèn các cạnh còn lại/i }));
    fireEvent.click(screen.getByRole("button", { name: "Phát animation: Chèn từ DL vào FR" }));
    fireEvent.click(screen.getByRole("button", { name: "Đặt lại" }));

    expect(screen.getByTestId("fto-preview")).toHaveAttribute("data-scramble", "R' D' R");
    expect(screen.getByTestId("fto-preview")).toHaveAttribute("data-animation", "");
  });
});
