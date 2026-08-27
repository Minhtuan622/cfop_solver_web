import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FTO_NAUTILUS_WALKTHROUGH_SCRAMBLE, ftoWalkthroughStateAfter, ftoWalkthroughStateBefore } from "@/lib/ftoBeginnerGuide";
import { FtoBeginnerGuide } from "./FtoBeginnerGuide";

vi.mock("@/components/PuzzleScramblePreview", () => ({
  PuzzleScramblePreview: ({ scramble, animationAlg }: { scramble: string; animationAlg?: string }) => <output data-testid="fto-preview" data-scramble={scramble} data-animation={animationAlg ?? ""} />,
}));

afterEach(() => cleanup());

describe("FtoBeginnerGuide Nautilus walkthrough", () => {
  it("opens directly on the named Nautilus method and one fixed scramble", () => {
    render(<FtoBeginnerGuide language="vi" />);
    expect(screen.getByText("Nautilus · FTO Speedsolving")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^First Block/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(FTO_NAUTILUS_WALKTHROUGH_SCRAMBLE)).toBeInTheDocument();
    expect(screen.getByText("Trước mốc này")).toBeInTheDocument();
    expect(screen.getByText("Sau mốc này")).toBeInTheDocument();
    expect(screen.getAllByTestId("fto-preview")[0]).toHaveAttribute("data-scramble", ftoWalkthroughStateBefore(0));
    expect(screen.getAllByTestId("fto-preview")[1]).toHaveAttribute("data-scramble", ftoWalkthroughStateAfter(0));
  });

  it("plays the current phase from its displayed checkpoint", () => {
    render(<FtoBeginnerGuide language="vi" />);
    fireEvent.click(screen.getByRole("button", { name: "Phát đoạn 1: R U' R' L' U L" }));

    expect(screen.getByText("Đang chạy: R U' R' L' U L")).toBeInTheDocument();
    expect(screen.getAllByTestId("fto-preview")[0]).toHaveAttribute("data-scramble", ftoWalkthroughStateBefore(0));
    expect(screen.getAllByTestId("fto-preview")[0]).toHaveAttribute("data-animation", "R U' R' L' U L");
  });

  it("shows the prior after state as the next phase before state", () => {
    render(<FtoBeginnerGuide language="vi" />);
    fireEvent.click(screen.getByRole("button", { name: "Giai đoạn tiếp" }));

    expect(screen.getByRole("tab", { name: /^Centres/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByTestId("fto-preview")[0]).toHaveAttribute("data-scramble", ftoWalkthroughStateBefore(1));
    expect(ftoWalkthroughStateBefore(1)).toBe(ftoWalkthroughStateAfter(0));
  });

  it("splits the final Last Layer animation into L6X then L3C", () => {
    render(<FtoBeginnerGuide language="vi" />);
    fireEvent.click(screen.getByRole("tab", { name: /^Last Layer/ }));
    expect(screen.getByRole("button", { name: /Phát đoạn 1: r U R'/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Phát đoạn 2: U R' F'/i })).toBeInTheDocument();
  });
});
