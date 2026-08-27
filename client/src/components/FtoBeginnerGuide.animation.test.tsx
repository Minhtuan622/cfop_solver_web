import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FTO_NAUTILUS_1LLL_CAPSTONE, FTO_NAUTILUS_WALKTHROUGH_SCRAMBLE, ftoWalkthroughStateAfter, ftoWalkthroughStateBefore } from "@/lib/ftoBeginnerGuide";
import { FtoBeginnerGuide } from "./FtoBeginnerGuide";

vi.mock("@/components/PuzzleScramblePreview", () => ({
  PuzzleScramblePreview: ({ scramble, animationAlg }: { scramble: string; animationAlg?: string }) => <output data-testid="fto-preview" data-scramble={scramble} data-animation={animationAlg ?? ""} />,
}));

afterEach(() => cleanup());

describe("FtoBeginnerGuide Nautilus walkthrough", () => {
  it("opens directly on Advanced Nautilus and one fixed advanced scramble", () => {
    render(<FtoBeginnerGuide language="vi" />);
    expect(screen.getByText("Nautilus · Advanced endgame")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^Last Triple · Advanced/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(FTO_NAUTILUS_WALKTHROUGH_SCRAMBLE)).toBeInTheDocument();
    expect(screen.getByText("Trước stage này")).toBeInTheDocument();
    expect(screen.getByText("Sau stage này")).toBeInTheDocument();
    expect(screen.getAllByTestId("fto-preview")[0]).toHaveAttribute("data-scramble", ftoWalkthroughStateBefore(0));
    expect(screen.getAllByTestId("fto-preview")[1]).toHaveAttribute("data-scramble", ftoWalkthroughStateAfter(0));
  });

  it("plays the current phase from its displayed checkpoint", () => {
    render(<FtoBeginnerGuide language="vi" />);
    fireEvent.click(screen.getByRole("button", { name: "Phát stage nâng cao: F' R' L R L' F R U' R'" }));

    expect(screen.getByText("Đang chạy: F' R' L R L' F R U' R'")).toBeInTheDocument();
    expect(screen.getAllByTestId("fto-preview")[0]).toHaveAttribute("data-scramble", ftoWalkthroughStateBefore(0));
    expect(screen.getAllByTestId("fto-preview")[0]).toHaveAttribute("data-animation", "F' R' L R L' F R U' R'");
  });

  it("shows the prior after state as the next phase before state", () => {
    render(<FtoBeginnerGuide language="vi" />);
    fireEvent.click(screen.getByRole("button", { name: "Stage tiếp" }));

    expect(screen.getByRole("tab", { name: /^L6X · One-look/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByTestId("fto-preview")[0]).toHaveAttribute("data-scramble", ftoWalkthroughStateBefore(1));
    expect(ftoWalkthroughStateBefore(1)).toBe(ftoWalkthroughStateAfter(0));
  });

  it("keeps one-look L3C and direct 1LLL as distinct advanced alternatives", () => {
    render(<FtoBeginnerGuide language="vi" />);
    fireEvent.click(screen.getByRole("tab", { name: /^L3C · One-look/ }));
    expect(screen.getAllByText(/Two flip counterclockwise permutation/).length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getByRole("button", { name: `Phát case 1LLL: ${FTO_NAUTILUS_1LLL_CAPSTONE.algorithm}` }));
    expect(screen.getAllByTestId("fto-preview")[2]).toHaveAttribute("data-scramble", FTO_NAUTILUS_1LLL_CAPSTONE.setupAlg);
    expect(screen.getAllByTestId("fto-preview")[2]).toHaveAttribute("data-animation", FTO_NAUTILUS_1LLL_CAPSTONE.algorithm);
  });
});
