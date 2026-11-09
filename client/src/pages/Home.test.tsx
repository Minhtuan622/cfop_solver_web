import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./Home";

const mocks = vi.hoisted(() => ({
  solve: vi.fn(),
  validate: vi.fn(),
  bld: vi.fn(),
}));

vi.mock("@/lib/solverRuntime", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/solverRuntime")>();
  return {
    ...original,
    warmSolverInBrowser: () => Promise.resolve(),
    solveInBrowser: mocks.solve,
    validateStateInBrowser: mocks.validate,
    analyzeBldInBrowser: mocks.bld,
  };
});

const SOLVED = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

function solverResult() {
  return {
    initial_state: SOLVED,
    final_state: SOLVED,
    algorithm: "R U R' U'",
    phases: [
      {
        name: "cross",
        algorithm: "D",
        moves: ["D"],
        state_after: SOLVED,
        valid_after: true,
        predicate_after: true,
        case_id: null,
        start: 0,
        end: 1,
      },
    ],
    trace: [{ index: 0, phase: "cross", move: "D", state: SOLVED }],
    opening: { requested: "cross", target: "cross", achieved: "cross", attempts: ["cross"], fallback_count: 0, did_fallback: false },
    last_layer: { requested: "auto", achieved: "oll_pll", attempts: ["oll_pll"], fallback_count: 0, did_fallback: false },
  };
}

beforeEach(() => {
  mocks.solve.mockReset().mockResolvedValue(solverResult());
  mocks.validate.mockReset().mockResolvedValue({ valid: true, message: "Trạng thái hợp lệ." });
  mocks.bld.mockReset();
  localStorage.clear();
});

afterEach(() => cleanup());

describe("the Rubik solver workspace", () => {
  it("gives the page a single heading and a quiet toolbar", () => {
    render(<Home />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "3×3 CFOP" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Xáo trộn" })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the playback controls out of the way until there is a solution", () => {
    render(<Home />);

    expect(screen.queryByRole("button", { name: "Phát" })).not.toBeInTheDocument();
    expect(screen.getByText(/Bấm “Tìm cách giải”/)).toBeInTheDocument();
  });

  it("switches to the painted cube and shows the recent states", () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: "Trạng thái cube" }));

    expect(screen.getByLabelText("Chuỗi 54 sticker")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Phát" })).not.toBeInTheDocument();
  });

  it("runs the solver and unfolds the solution report", async () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /Tìm cách giải/ }));

    await waitFor(() => expect(mocks.solve).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole("button", { name: "Phát" })).toBeInTheDocument());
    expect(screen.getAllByText(/1 nước/).length).toBeGreaterThan(0);
  });

  it("lets the user stop a solver that is still running", async () => {
    mocks.solve.mockReturnValue(new Promise(() => undefined));
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /Tìm cách giải/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Dừng" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Dừng" }));

    expect(screen.getByText("Đã dừng solver theo yêu cầu.")).toBeInTheDocument();
  });
});
