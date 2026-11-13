import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./Home";
import type { BldResult } from "@/lib/solverRuntime";

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

function bldResult(): BldResult {
  return {
    initial_state:
      "UULUUFUUFRRUBRRURRFFDFFUFFFDDRDDDDDDBLLLLLLLLBRRBBBBBB",
    analysis: {
      method: "3style-speffz",
      buffers: {
        edge: { letter: "C", position: "UF" },
        corner: { letter: "A", position: "UBL" },
      },
      edges: {
        cycles: [
          {
            buffer: "C",
            targets: ["D", "L"],
            cycle_break: true,
            memo: "DL",
            execution_keys: ["CDL"],
          },
        ],
        memo: ["•D", "L•"],
        execution_keys: ["CDL"],
      },
      corners: {
        cycles: [
          {
            buffer: "A",
            targets: ["B", "E", "Q", "R", "N"],
            cycle_break: false,
            memo: "BEQRN",
            execution_keys: ["ABE", "AQR"],
          },
        ],
        memo: ["BE", "QR", "N•"],
        execution_keys: ["ABE", "AQR"],
      },
      special: {
        parity: false,
        edge_flips: [],
        corner_twists: [{ position: "UFR", direction: "ccw" }],
        edge_orientation_sum: 0,
        corner_orientation_sum: 2,
      },
      solved: false,
      catalog: {
        provider: "BLDDB",
        source: "https://github.com/nbwzx/blddb",
        note: "Execution algorithms are resolved by exact Speffz key.",
      },
    },
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

  it("builds a 3-Style memo and renders the BLD report", async () => {
    mocks.bld.mockResolvedValue(bldResult());
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: "3×3 BLD" }));
    fireEvent.click(
      screen.getByRole("button", { name: /TẠO MEMO 3-STYLE/ })
    );

    await waitFor(() =>
      expect(mocks.bld).toHaveBeenCalledWith("scramble", expect.any(String))
    );
    expect(await screen.findByText("Memo và execution")).toBeInTheDocument();
    expect(screen.getByText("3-Style BLD · Speffz")).toBeInTheDocument();
    expect(
      screen.queryByText("Đã xảy ra lỗi không mong muốn.")
    ).not.toBeInTheDocument();
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
