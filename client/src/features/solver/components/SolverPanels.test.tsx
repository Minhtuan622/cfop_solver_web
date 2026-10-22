import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SolverInputPanel } from "./SolverInputPanel";
import { SolverSolutionPanel } from "./SolverSolutionPanel";
import { SolverToolbar } from "./SolverToolbar";

afterEach(() => cleanup());

describe("the solver toolbar", () => {
  it("marks the chosen solver and input", () => {
    render(
      <SolverToolbar solverKind="cfop" onSolverKindChange={() => undefined} mode="scramble" onModeChange={() => undefined} loading={false} status="" />,
    );

    expect(screen.getByRole("button", { name: "Giải Rubik" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Nâng cao" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("status")).toHaveTextContent("Sẵn sàng");
  });

  it("tells the visitor that the engine is working", () => {
    render(
      <SolverToolbar solverKind="cfop" onSolverKindChange={() => undefined} mode="scramble" onModeChange={() => undefined} loading status="Đang tìm cross…" />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Đang tìm cross…");
  });
});

describe("the solver input panel", () => {
  it("asks for a scramble with a visible label", () => {
    render(
      <SolverInputPanel
        solverKind="cfop"
        mode="scramble"
        value="R U"
        loading={false}
        status=""
        error=""
        stateValidation={null}
        paintColor="U"
        canUndo={false}
        canRedo={false}
        recentStates={[]}
        onValueChange={() => undefined}
        onStateEdit={() => undefined}
        onUndo={() => undefined}
        onRedo={() => undefined}
        onPaintColorChange={() => undefined}
        onRandomScramble={() => undefined}
        onSolve={() => undefined}
        onSelectRecentState={() => undefined}
        onRemoveRecentState={() => undefined}
        onCameraState={() => undefined}
      />,
    );

    expect(screen.getByLabelText("Các nước xoay xáo trộn")).toHaveValue("R U");
    expect(screen.getByRole("button", { name: /Scramble ngẫu nhiên/ })).toBeInTheDocument();
  });

  it("refuses to solve a state that has not been validated", () => {
    const onSolve = vi.fn();
    render(
      <SolverInputPanel
        solverKind="cfop"
        mode="state"
        value="UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
        loading={false}
        status=""
        error=""
        stateValidation={null}
        paintColor="U"
        canUndo={false}
        canRedo={false}
        recentStates={[]}
        onValueChange={() => undefined}
        onStateEdit={() => undefined}
        onUndo={() => undefined}
        onRedo={() => undefined}
        onPaintColorChange={() => undefined}
        onRandomScramble={() => undefined}
        onSolve={onSolve}
        onSelectRecentState={() => undefined}
        onRemoveRecentState={() => undefined}
        onCameraState={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: /TÌM CÁCH GIẢI/ })).toBeDisabled();
  });
});

describe("the solver solution panel", () => {
  const base = {
    view: "3d" as const,
    onViewChange: () => undefined,
    title: "Cross",
    subtitle: "Nước xoay: D",
    move: "D",
    moveLabel: "Nước xoay",
    turnCount: 12,
    cursor: 0,
    playing: false,
    playbackSpeed: 1,
    onTogglePlay: () => undefined,
    onStep: () => undefined,
    onReset: () => undefined,
    onSeek: () => undefined,
    onPlaybackSpeedChange: () => undefined,
    children: <div>the cube</div>,
  };

  it("hides the playback until there is something to play", () => {
    render(<SolverSolutionPanel {...base} hasResult={false} />);

    expect(screen.queryByRole("button", { name: "Phát" })).not.toBeInTheDocument();
    expect(screen.getByText(/Bấm “Tìm cách giải”/)).toBeInTheDocument();
  });

  it("walks the solution once there is one", () => {
    const onStep = vi.fn();
    render(<SolverSolutionPanel {...base} hasResult onStep={onStep} />);

    fireEvent.click(screen.getByRole("button", { name: "Sau" }));
    expect(onStep).toHaveBeenCalledWith(1);
  });
});
