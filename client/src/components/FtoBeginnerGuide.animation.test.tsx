import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FTO_BENCISCO_WALKTHROUGH, FTO_BENCISCO_WALKTHROUGH_SCRAMBLE, ftoWalkthroughStateAfter, ftoWalkthroughStateBefore } from "@/lib/ftoBeginnerGuide";
import { FtoBeginnerGuide } from "./FtoBeginnerGuide";

vi.mock("@/components/PuzzleScramblePreview", () => ({
  PuzzleScramblePreview: ({ scramble, animationAlg, focusFtoWhiteFace, focusFtoFace }: { scramble: string; animationAlg?: string; focusFtoWhiteFace?: boolean; focusFtoFace?: string }) => <output data-testid="fto-preview" data-scramble={scramble} data-animation={animationAlg ?? ""} data-focus-white={String(focusFtoWhiteFace ?? false)} data-focus-face={focusFtoFace ?? ""} />,
}));

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

describe("FtoBeginnerGuide Bencisco walkthrough", () => {
  it("opens with Bencisco and the white center as the first concrete milestone", () => {
    render(<FtoBeginnerGuide language="vi" />);
    expect(screen.getByText("Bencisco")).toBeTruthy();
    expect(screen.getByText("1. Bencisco · Hoàn thành white center / hexagon")).toBeTruthy();
    expect(screen.getByText(FTO_BENCISCO_WALKTHROUGH_SCRAMBLE)).toBeTruthy();
    expect(screen.getByText(/Tìm trên chính mô hình 3D bên dưới/)).toBeTruthy();
    expect(screen.getAllByTestId("fto-preview")[0].getAttribute("data-scramble")).toBe(ftoWalkthroughStateBefore(0));
    expect(screen.getAllByTestId("fto-preview")[1].getAttribute("data-scramble")).toBe(ftoWalkthroughStateAfter(0));
    expect(screen.getAllByTestId("fto-preview").every((preview) => preview.getAttribute("data-focus-white") === "true")).toBe(true);
  });

  it("plays the selected Bencisco phase from its displayed before checkpoint", () => {
    render(<FtoBeginnerGuide language="vi" />);
    fireEvent.click(screen.getByRole("button", { name: /Phát stage/ }));

    expect(screen.getAllByTestId("fto-preview")[0].getAttribute("data-scramble")).toBe(ftoWalkthroughStateBefore(0));
    expect(screen.getAllByTestId("fto-preview")[0].getAttribute("data-animation")).toBe(FTO_BENCISCO_WALKTHROUGH[0].algorithm);
  });

  it("uses the prior after state as the next stage before state", () => {
    render(<FtoBeginnerGuide language="vi" />);
    fireEvent.click(screen.getByRole("button", { name: /First Two Triples/ }));

    expect(screen.getByText("2. Bencisco · First Two Triples (F2T)")).toBeTruthy();
    expect(screen.getAllByTestId("fto-preview")[0].getAttribute("data-scramble")).toBe(ftoWalkthroughStateBefore(1));
    expect(ftoWalkthroughStateBefore(1)).toBe(ftoWalkthroughStateAfter(0));
  });

  it("opens the exact Before checkpoint for stage 3 through its walkthrough deep-link", () => {
    window.history.replaceState({}, "", "/study?lane=fto&ftoStage=3");
    render(<FtoBeginnerGuide language="vi" />);

    expect(screen.getByText("3. Bencisco · Dựng tâm cam (center thứ hai)")).toBeTruthy();
    expect(screen.getByText("Đã xong: tâm trắng + 2 triple. Chưa dựng tâm cam.")).toBeTruthy();
    expect(screen.getByText("Mới hoàn thành: tâm cam. Tâm trắng + 2 triple vẫn được giữ.")).toBeTruthy();
    expect(screen.getAllByTestId("fto-preview")[0].getAttribute("data-scramble")).toBe(ftoWalkthroughStateBefore(2));
    expect(screen.getAllByTestId("fto-preview")[0].getAttribute("data-focus-white")).toBe("true");
    expect(screen.getAllByTestId("fto-preview")[1].getAttribute("data-focus-face")).toBe("orange");
  });
});
